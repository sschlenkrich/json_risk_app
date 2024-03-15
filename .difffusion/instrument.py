import json
import math
import re

def parse_instrument(instrument, cash_flows):
    if instrument['type'] == 'bond':
        cfs = parse_bond(cash_flows)
    #
    alias = 'leg/' + instrument['id']
    notionals = [ 1.0 for cf in cash_flows ]
    curve_key = None   # default (ESTR) discounting
    fx_key = None  # default
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


def parse_bond(cash_flows):
    pay_times = cash_flows['cashflowtable']['t_pmt']
    amounts = cash_flows['cashflowtable']['pmt_total']
    cfs = []
    for pay_time, amount in zip(pay_times, amounts):
        if pay_time > 0:  # assume today's cash flows are gone already
            cf = {
                'typename' : 'DiffFusion.FixedCashFlow',
                'constructor' : 'FixedCashFlow',
                'pay_time' : pay_time,
                'amount' : amount,
            }
            cfs.append(cf)
    #
    return cfs


if __name__ == '__main__':
    instr_file_name = '.difffusion/bond.json'
    cflow_file_name = '.difffusion/bond_cash_flows.json'
    with open(instr_file_name, "r") as f:
        instrument = json.load(f)
    with open(cflow_file_name, "r") as f:
        cash_flows = json.load(f)
    #
    res = parse_instrument(instrument, cash_flows)
    for r in res:
        print(r['alias'] + ', ' + r['typename'])
