import json
import requests

def parse_instrument(instrument, cash_flows):
    if instrument['type'] == 'bond':
        cfs, notionals = parse_bond_cash_flows(instrument, cash_flows)
    if instrument['type'] == 'floater':
        cfs, notionals = parse_floater_cash_flows(instrument, cash_flows)
    #
    alias = 'leg/' + instrument['id']
    curve_key = instrument['currency']  # default (ESTR) discounting; this might not be correct
    fx_key = "nothing"  # default
    if instrument['currency'] != 'EUR':  # assume EUR is domestic and numeraire currency
        fx_key = instrument['currency'] + '-EUR'
    payer_receiver = 1.0
    return [{
        'typename' : 'DiffFusion.DeterministicCashFlowLeg',
        'constructor' : 'cashflow_leg',
        'alias' : alias,
        'cashflows' : cfs,
        'notionals' : notionals,
        'curve_key' : curve_key,
        'fx_key' : fx_key,
        'payer_receiver' : payer_receiver,
    }]


def parse_bond_cash_flows(instrument, cash_flows):
    print('Parse bond...')
    initial_notional = instrument['notional']
    assert initial_notional > 0
    pay_times = cash_flows['cashflowtable']['t_pmt']
    amounts = cash_flows['cashflowtable']['pmt_total']
    cfs = []
    notionals = []
    for pay_time, amount in zip(pay_times, amounts):
        if pay_time > 0:  # assume today's cash flows are gone already
            cf = {
                'typename' : 'DiffFusion.FixedCashFlow',
                'constructor' : 'FixedCashFlow',
                'pay_time' : pay_time,
                'amount' : amount / initial_notional,
            }
            cfs.append(cf)
            notionals.append(initial_notional)
    #
    return cfs, notionals


def parse_floater_cash_flows(instrument, cash_flows):
    print('Parse floater...')
    pay_times = cash_flows['cashflowtable']['t_pmt']
    cfs = []
    notionals = []
    for k, pay_time in enumerate(pay_times):
        if pay_time <= 0:  # assume today's cash flows are gone already
            continue
        if not cash_flows['cashflowtable']['is_interest_date'][k]:
            # we only have a fixed flow
            amount = cash_flows['cashflowtable']['pmt_principal'][k]
            if amount == 0:
                continue  # no cash flow required
            cfs.append({
                'typename' : 'DiffFusion.FixedCashFlow',
                'constructor' : 'FixedCashFlow',
                'pay_time' : pay_time,
                'amount' : amount / abs(amount),
            })
            notionals.append(abs(amount))
        else:
            notional = cash_flows['cashflowtable']['current_principal'][k]
            assert notional > 0  # otherwise, I did not get the data model
            amount = cash_flows['cashflowtable']['pmt_principal'][k]
            if amount != 0:  # add a FixedCashFlow
                cfs.append({
                    'typename' : 'DiffFusion.FixedCashFlow',
                    'constructor' : 'FixedCashFlow',
                    'pay_time' : pay_time,
                    'amount' : amount / notional,
                })
                notionals.append(notional)
            # add a coupon
            fixing_time = cash_flows['cashflowtable']['t_accrual_start'][k]  # assume no fixing offset here; this is wrong
            if fixing_time <= 0.0:
                cf = {
                    'typename' : 'DiffFusion.FixedRateCoupon',
                    'constructor' : 'FixedRateCoupon',
                    'pay_time' : pay_time,
                    'fixed_rate' : instrument['float_current_rate'] + instrument['float_spread'], # this is bad... what if valuation time changes
                    'first_time' : cash_flows['cashflowtable']['t_accrual_start'][k],
                }
            else:
                curve_key = instrument['currency'] + ':IBOR'  # assume there is a single projection curve per currency; this is wrong
                cf = {
                    'typename' : 'DiffFusion.SimpleRateCoupon',
                    'constructor' : 'SimpleRateCoupon',
                    'fixing_time' : fixing_time,
                    'start_time' : cash_flows['cashflowtable']['t_accrual_start'][k],
                    'end_time' : cash_flows['cashflowtable']['t_accrual_end'][k],
                    'pay_time' : pay_time,
                    'year_fraction' : cash_flows['cashflowtable']['accrual_factor'][k],
                    'curve_key' : curve_key,
                    'fixing_key' : "nothing",  # unfortunately, we cannot model fixed SimpleRateCoupon's
                    'spread_rate' : instrument['float_spread'],
                }
            cfs.append(cf)
            notionals.append(notional)
    return cfs, notionals



if __name__ == '__main__':
    res = []
    instr_file_name = '.difffusion/bond.json'
    cflow_file_name = '.difffusion/bond_cash_flows.json'
    with open(instr_file_name, "r") as f:
        instrument = json.load(f)
    with open(cflow_file_name, "r") as f:
        cash_flows = json.load(f)
    res += parse_instrument(instrument, cash_flows)
    #
    instr_file_name = '.difffusion/floater_1.json'
    cflow_file_name = '.difffusion/floater_1_cash_flows.json'
    with open(instr_file_name, "r") as f:
        instrument = json.load(f)
    with open(cflow_file_name, "r") as f:
        cash_flows = json.load(f)
    res += parse_instrument(instrument, cash_flows)
    #
    instr_file_name = '.difffusion/floater_2.json'
    cflow_file_name = '.difffusion/floater_2_cash_flows.json'
    with open(instr_file_name, "r") as f:
        instrument = json.load(f)
    with open(cflow_file_name, "r") as f:
        cash_flows = json.load(f)
    res += parse_instrument(instrument, cash_flows)
    #
    for r in res:
        print(r['alias'] + ', ' + r['typename'])
    #
    out_file_name = '.difffusion/instruments.json'
    with open(out_file_name, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=4)
    #
    resp = requests.get('http://localhost:2024/api/v1/info')
    print(resp)
    for obj in res:
        resp = requests.post(
            'http://localhost:2024/api/v1/ops',
            headers={ 'alias' : obj['alias'], 'op' : 'BUILD' },
            data=json.dumps(obj),
            )
        print(resp.json())