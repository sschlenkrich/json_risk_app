import json
import math
import re

def parse_instrument(instrument, cash_flows):
    if instrument['type'] == 'bond':
        cfs, notionals = parse_bond_cash_flows(instrument, cash_flows)
    if instrument['type'] == 'floater':
        cfs, notionals = parse_floater_cash_flows(instrument, cash_flows)
    #
    alias = 'leg/' + instrument['id']
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
