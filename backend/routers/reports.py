from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
import io, calendar

from database import get_db
from models import Transaction, Account, Category, Asset, Liability, User
from schemas import DashboardSummary, MonthlyCashflow, CategoryExpense
from routers.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    month: Optional[str] = Query(None)
):
    now = datetime.now()
    year, m = (int(month.split('-')[0]), int(month.split('-')[1])) if month else (now.year, now.month)
    date_from = date(year, m, 1)
    date_to = date(year, m, calendar.monthrange(year, m)[1])

    accounts = db.query(Account).filter(Account.user_id == current_user.id, Account.is_active == True).all()
    total_balance = sum(a.balance for a in accounts) or Decimal('0')

    income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'income',
        Transaction.date >= date_from, Transaction.date <= date_to
    ).scalar() or Decimal('0')

    expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id, Transaction.type == 'expense',
        Transaction.date >= date_from, Transaction.date <= date_to
    ).scalar() or Decimal('0')

    total_assets = db.query(func.sum(Asset.current_value)).filter(
        Asset.user_id == current_user.id, Asset.is_active == True
    ).scalar() or Decimal('0')

    total_liabilities = db.query(func.sum(Liability.amount)).filter(
        Liability.user_id == current_user.id, Liability.is_active == True
    ).scalar() or Decimal('0')

    net_worth = total_balance + total_assets - total_liabilities
    saving_ratio = round(float((income - expense) / income * 100), 2) if income > 0 else 0.0

    from schemas import AccountOut
    return DashboardSummary(
        total_balance=total_balance, total_income=income, total_expense=expense,
        net_worth=net_worth, saving_ratio=saving_ratio,
        total_assets=total_assets, total_liabilities=total_liabilities,
        accounts=[AccountOut.model_validate(a) for a in accounts],
    )


@router.get("/cashflow", response_model=List[MonthlyCashflow])
def cashflow(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    months: int = Query(12, ge=1, le=24)
):
    from dateutil.relativedelta import relativedelta
    result, now = [], datetime.now()
    for i in range(months - 1, -1, -1):
        d = now - relativedelta(months=i)
        year, m = d.year, d.month
        date_from = date(year, m, 1)
        date_to = date(year, m, calendar.monthrange(year, m)[1])
        inc = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id, Transaction.type == 'income',
            Transaction.date >= date_from, Transaction.date <= date_to
        ).scalar() or Decimal('0')
        exp = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id, Transaction.type == 'expense',
            Transaction.date >= date_from, Transaction.date <= date_to
        ).scalar() or Decimal('0')
        result.append(MonthlyCashflow(month=f"{year}-{m:02d}", income=inc, expense=exp, net=inc - exp))
    return result


@router.get("/categories", response_model=List[CategoryExpense])
def category_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    month: Optional[str] = Query(None),
    type: str = Query('expense')
):
    now = datetime.now()
    year, m = (int(month.split('-')[0]), int(month.split('-')[1])) if month else (now.year, now.month)
    date_from = date(year, m, 1)
    date_to = date(year, m, calendar.monthrange(year, m)[1])
    rows = db.query(Transaction.category_id, func.sum(Transaction.amount).label('total')).filter(
        Transaction.user_id == current_user.id, Transaction.type == type,
        Transaction.date >= date_from, Transaction.date <= date_to
    ).group_by(Transaction.category_id).all()
    grand = sum(r.total for r in rows) or Decimal('1')
    result = []
    for r in rows:
        cat = db.query(Category).filter(Category.id == r.category_id).first() if r.category_id else None
        result.append(CategoryExpense(
            category_id=r.category_id,
            category_name=cat.name if cat else 'Lainnya',
            color=cat.color if cat else '#6b7280',
            total=r.total, pct=round(float(r.total / grand) * 100, 2)
        ))
    return sorted(result, key=lambda x: x.total, reverse=True)


@router.get("/export/pdf")
def export_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    month: Optional[str] = Query(None)
):
    import weasyprint
    now = datetime.now()
    year, m = (int(month.split('-')[0]), int(month.split('-')[1])) if month else (now.year, now.month)
    date_from = date(year, m, 1)
    date_to = date(year, m, calendar.monthrange(year, m)[1])
    month_label = date_from.strftime('%B %Y')
    txs = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= date_from, Transaction.date <= date_to
    ).order_by(Transaction.date.desc()).all()
    income = sum(t.amount for t in txs if t.type == 'income') or Decimal('0')
    expense = sum(t.amount for t in txs if t.type == 'expense') or Decimal('0')
    net = income - expense
    ratio = round(float(net / income * 100), 1) if income > 0 else 0
    rows_html = ""
    for t in txs:
        cat = db.query(Category).filter(Category.id == t.category_id).first() if t.category_id else None
        sign = '+' if t.type == 'income' else '-' if t.type == 'expense' else ''
        badge = {'income': '#d1fae5;color:#065f46', 'expense': '#fee2e2;color:#991b1b', 'transfer': '#e0e7ff;color:#3730a3'}.get(t.type, '')
        rows_html += f"""<tr><td>{t.date}</td><td><span style='background:{badge};padding:2px 8px;border-radius:12px;font-size:11px'>{t.type}</span></td>
        <td>{cat.name if cat else '-'}</td><td>{t.note or '-'}</td>
        <td style='text-align:right;font-weight:bold'>{sign}Rp {t.amount:,.0f}</td></tr>"""
    html = f"""<!DOCTYPE html><html><head><meta charset='UTF-8'><style>
    body{{font-family:Arial,sans-serif;padding:24px;color:#1f2937}}
    h1{{color:#6366f1}}h2{{color:#374151;border-bottom:1px solid #e5e7eb;padding-bottom:8px}}
    .cards{{display:flex;gap:16px;margin:16px 0}}.card{{background:#f9fafb;border-radius:8px;padding:16px;flex:1}}
    .card h3{{margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase}}
    .card p{{margin:0;font-size:22px;font-weight:bold}}
    .g{{color:#10b981}}.r{{color:#ef4444}}.b{{color:#6366f1}}
    table{{width:100%;border-collapse:collapse;margin-top:16px}}
    th{{background:#f3f4f6;text-align:left;padding:8px 12px;font-size:12px}}
    td{{padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px}}
    </style></head><body>
    <h1>FinanceFlow Report</h1>
    <p>Periode: <strong>{month_label}</strong> &nbsp; Pengguna: <strong>{current_user.name}</strong></p>
    <div class='cards'>
      <div class='card'><h3>Pemasukan</h3><p class='g'>Rp {income:,.0f}</p></div>
      <div class='card'><h3>Pengeluaran</h3><p class='r'>Rp {expense:,.0f}</p></div>
      <div class='card'><h3>Net</h3><p class='b'>Rp {net:,.0f}</p></div>
      <div class='card'><h3>Rasio Tabungan</h3><p class='b'>{ratio}%</p></div>
    </div>
    <h2>Daftar Transaksi ({len(txs)} transaksi)</h2>
    <table><tr><th>Tanggal</th><th>Jenis</th><th>Kategori</th><th>Catatan</th><th style='text-align:right'>Jumlah</th></tr>
    {rows_html}</table></body></html>"""
    pdf = weasyprint.HTML(string=html).write_pdf()
    fn = f"financeflow_{year}_{m:02d}.pdf"
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={fn}"})
