
import json
import math
import re

def isnumber(x):
    return isinstance(x, int) or isinstance(x, float)

def parse_params(key, value):
    """
    Return a list of dictionaries that represent serialised DiffFusion.js objects.
    """
    obj_list = []
    assert (key is None) or isinstance(key, str)
    if key is None:
        for key in value:
            obj_list = obj_list + parse_params(key, value[key])
        return obj_list
    #
    match key:
        case 'curves':
            print('Parse curves...')
            for key in value:
                obj_list = obj_list + parse_curve(key, value[key])
            return obj_list
        case 'surfaces':
            print('Parse surfaces...')
            # do something
            return obj_list
        case 'scalars':
            print('Parse scalars...')            
            # do something
            for key in value:
                obj_list = obj_list + parse_scalar(key, value[key])
            return obj_list
    #
    # better throw an exception if we end up here
    return obj_list


def parse_curve(key, value):
    print('Parse curve ' + key + '...')
    if 'dfs' in value:
        return parse_discount_factor_curve(key, value)
    if 'zcs' in value:
        return parse_zero_rate_curve(key, value)
    # better throw an exception
    return []


def parse_discount_factor_curve(key, value):
    print('Parse discount factor curve ' + key + '...')
    assert 'times' in value
    assert 'dfs' in value
    assert len(value['times']) > 0
    assert len(value['times']) == len(value['dfs'])
    assert value['times'][0] > 0
    alias = 'yc/' + key
    if len(value['times']) == 1:
        typename = 'DiffFusion.FlatForward'
        constructor = 'FlatForward'
        rate = -math.log(value['dfs'][0]) / value['times'][0]
        return [{
            'typename' : 'DiffFusion.FlatForward',
            'constructor' : 'FlatForward',
            'alias' : alias,
            'rate' : rate,
        }]
    else:
        values = [ -math.log(df)/T for T, df in zip(value['times'], value['dfs']) ]
        return [{
            'typename' : 'DiffFusion.ZeroCurve',
            'constructor' : 'zero_curve',
            'alias' : alias,
            'times' : value['times'],
            'values' : values,
        }]


def parse_zero_rate_curve(key, value):
    print('Parse zero rate curve ' + key + '...')
    assert 'labels' in value
    assert 'zcs' in value
    assert len(value['labels']) > 0
    assert len(value['labels']) == len(value['zcs'])
    prog = re.compile('^[0-9]+[D,M,Y]$')
    for label in value['labels']:
        assert prog.match(label)
    for rate in value['zcs']:
        assert isnumber(rate)
    alias = 'yc/' + key  # maybe better use 'id' here
    times = []
    # term to time calculation is business logic; better remove this
    for label in value['labels']:
        unit = value['labels'][-1]
        year_fraction = 1.0  # default is 'Y'
        if unit=='M':
            year_fraction = 1.0/12.0
        if unit=='D':
            year_fraction = 1.0/365.0  # we assume Act/365 convention here
        times.append(float(label[:-1]) * year_fraction)
    assert times[0] > 0
    # we assume annual compounded zero rates (and spreads) here; again, this is business logic and better is removed
    dfs = [ (1.0+r)**T for T, r in zip(times, value['zcs']) ]
    # currently, DiffFusion only knows continuous zero rates.
    zero_rates = [ -math.log(df)/T for T, df in zip(times, dfs) ]
    return [{
        'typename' : 'DiffFusion.ZeroCurve',
        'constructor' : 'zero_curve',
        'alias' : alias,
        'times' : times,
        'values' : zero_rates,
    }]


def parse_scalar(key, value):
    print('Parse scalar parameter ' + key + '...')
    assert 'type' in value
    if value['type'] == 'equity':
        return parse_equity_parameter(key, value)
    if value['type'] == 'fx':
        return parse_fx_parameter(key, value)
    # better throw an exception if we end up here
    return []


def parse_equity_parameter(key, value):
    print('Parse equity parameter ' + key + '...')
    assert 'value' in value
    assert len(value['value']) == 1
    assert isnumber(value['value'][0])
    assert value['value'][0] > 0
    alias = 'pa/' + key
    times = [ 0.0 ]  # assume value holds for time-0
    return [{
        'typename' : 'DiffFusion.ForwardFlatParameter',
        'constructor' : 'forward_flat_parameter',
        'alias' : alias,
        'times' : times,
        'values' : value['value'],
    }]


def parse_fx_parameter(key, value):
    print('Parse fx parameter ' + key + '...')
    assert 'value' in value
    assert len(value['value']) == 1
    assert isnumber(value['value'][0])
    assert value['value'][0] > 0
    prog = re.compile(r'^[A-Z]{3}$')  # we check that we have a currency code
    assert prog.match(key)  # maybe better rely on and use 'id'
    pair = key + '-EUR'  # DiffFusion relies on fx rates expressed as asset prices, i.e. FOR-DOM notation
    alias = 'pa/' + pair
    # we assume here that fx rates in JSONRisk are all EUR-CCY and EUR is domestic currency; again business logic
    fx_for_dom = 1.0 / value['value'][0]
    times = [ 0.0 ]  # assume value holds for time-0
    return [{
        'typename' : 'DiffFusion.ForwardFlatParameter',
        'constructor' : 'forward_flat_parameter',
        'alias' : alias,
        'times' : times,
        'values' : [ fx_for_dom ],
    }]


if __name__ == '__main__':
    json_file_name = '.var/public/params/2024-02-15_BASE.json'
    with open(json_file_name, "r") as f:
        data = json.load(f)
    #
    res = parse_params(None, data)
    for r in res:
        print(r['alias'] + ', ' + r['typename'])
    #
    instr_file_name = '.difffusion/bond.json'
    cflow_file_name = '.difffusion/bond_cash_flows.json'
    with open(instr_file_name, "r") as f:
        instrument = json.load(f)
    with open(cflow_file_name, "r") as f:
        cash_flows = json.load(f)
    #
    out_file_name = '.difffusion/parameters.json'
    with open(out_file_name, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=4)
