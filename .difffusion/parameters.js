// import json;
// import math;
// import re;
// import requests;

function isnumber(x) {
    return typeof x === 'number';
}

function parse_params(key, value) {
    var obj_list = [];
    if (key === null || typeof key === 'string') {
        if (key === null) {
            for (var key in value) {
                obj_list = obj_list.concat(parse_params(key, value[key]));
            }
            return obj_list;
        }
        switch (key) {
            case 'curves':
                console.log('Parse curves...');
                for (var key in value) {
                    obj_list = obj_list.concat(parse_curve(key, value[key]));
                }
                return obj_list;
            case 'surfaces':
                console.log('Parse surfaces...');
                return obj_list;
            case 'scalars':
                console.log('Parse scalars...');
                for (var key in value) {
                    obj_list = obj_list.concat(parse_scalar(key, value[key]));
                }
                return obj_list;
        }
    }
    return obj_list;
}

function parse_curve(key, value) {
    console.log('Parse curve ' + key + '...');
    if (value.includes('dfs')) {
        return parse_discount_factor_curve(key, value);
    }
    if (value.includes('zcs')) {
        return parse_zero_rate_curve(key, value);
    }
    return [];
}

function parse_discount_factor_curve(key, value) {
    console.log('Parse discount factor curve ' + key + '...');
    if (!('times' in value)) {
        throw new Error('Missing "times" key in value');
    }
    if (!('dfs' in value)) {
        throw new Error('Missing "dfs" key in value');
    }
    if (value['times'].length === 0) {
        throw new Error('Empty "times" array');
    }
    if (value['times'].length !== value['dfs'].length) {
        throw new Error('Length mismatch between "times" and "dfs" arrays');
    }
    if (value['times'][0] <= 0) {
        throw new Error('First element of "times" array must be greater than 0');
    }
    var alias = 'yc/' + key;
    if (value['times'].length === 1) {
        var rate = -Math.log(value['dfs'][0]) / value['times'][0];
        return [{
            'typename': 'DiffFusion.FlatForward',
            'constructor': 'FlatForward',
            'alias': alias,
            'rate': rate,
        }];
    } else {
        var values = value['times'].map(function(T, i) {
            return -Math.log(value['dfs'][i]) / T;
        });
        return [{
            'typename': 'DiffFusion.ZeroCurve',
            'constructor': 'zero_curve',
            'alias': alias,
            'times': value['times'],
            'values': values,
        }];
    }
}

function parse_zero_rate_curve(key, value) {
    console.log('Parse zero rate curve ' + key + '...');
    if (!('labels' in value)) {
        throw new Error("Missing 'labels' in value");
    }
    if (!('zcs' in value)) {
        throw new Error("Missing 'zcs' in value");
    }
    if (value['labels'].length === 0) {
        throw new Error("Empty 'labels' in value");
    }
    if (value['labels'].length !== value['zcs'].length) {
        throw new Error("Length mismatch between 'labels' and 'zcs'");
    }
    var prog = /^[0-9]+[D,M,Y]$/;
    for (var i = 0; i < value['labels'].length; i++) {
        var label = value['labels'][i];
        if (!prog.test(label)) {
            throw new Error("Invalid label format: " + label);
        }
    }
    for (var i = 0; i < value['zcs'].length; i++) {
        var rate = value['zcs'][i];
        if (typeof rate !== 'number' || isNaN(rate)) {
            throw new Error("Invalid rate: " + rate);
        }
    }
    var alias = 'yc/' + key;
    var times = [];
    for (var i = 0; i < value['labels'].length; i++) {
        var label = value['labels'][i];
        var unit = value['labels'][value['labels'].length - 1];
        var year_fraction = 1.0;
        if (unit === 'M') {
            year_fraction = 1.0 / 12.0;
        }
        if (unit === 'D') {
            year_fraction = 1.0 / 365.0;
        }
        times.push(parseFloat(label.slice(0, -1)) * year_fraction);
    }
    if (times[0] <= 0) {
        throw new Error("First time must be greater than 0");
    }
    var dfs = times.map(function(T, i) {
        var r = value['zcs'][i];
        return Math.pow(1.0 + r, T);
    });
    var zero_rates = times.map(function(T, i) {
        var df = dfs[i];
        return -Math.log(df) / T;
    });
    return [{
        'typename': 'DiffFusion.ZeroCurve',
        'constructor': 'zero_curve',
        'alias': alias,
        'times': times,
        'values': zero_rates,
    }];
}

function parse_scalar(key, value) {
    console.log('Parse scalar parameter ' + key + '...');
    if ('type' in value) {
        if (value['type'] === 'equity') {
            return parse_equity_parameter(key, value);
        }
        if (value['type'] === 'fx') {
            return parse_fx_parameter(key, value);
        }
    }
    return [];
}

function parse_equity_parameter(key, value) {
    console.log('Parse equity parameter ' + key + '...');
    if (!('value' in value)) {
        throw new Error('Missing value key');
    }
    if (value['value'].length !== 1) {
        throw new Error('Invalid value length');
    }
    if (typeof value['value'][0] !== 'number') {
        throw new Error('Invalid value type');
    }
    if (value['value'][0] <= 0) {
        throw new Error('Value must be greater than 0');
    }
    var alias = 'pa/' + key;
    var times = [0.0];
    return [{
        'typename': 'DiffFusion.ForwardFlatParameter',
        'constructor': 'forward_flat_parameter',
        'alias': alias,
        'times': times,
        'values': value['value'],
    }];
}

function parse_fx_parameter(key, value) {
    console.log('Parse fx parameter ' + key + '...');
    if (!('value' in value)) {
        throw new Error('Missing value key');
    }
    if (value['value'].length !== 1) {
        throw new Error('Invalid value length');
    }
    if (typeof value['value'][0] !== 'number') {
        throw new Error('Invalid value type');
    }
    if (value['value'][0] <= 0) {
        throw new Error('Value must be greater than 0');
    }
    var prog = /^[A-Z]{3}$/;
    if (!prog.test(key)) {
        throw new Error('Invalid key format');
    }
    var pair = key + '-EUR';
    var alias = 'pa/' + pair;

    var fx_for_dom = 1.0 / value['value'][0];
    var times = [0.0];
    return [{
        'typename': 'DiffFusion.ForwardFlatParameter',
        'constructor': 'forward_flat_parameter',
        'alias': alias,
        'times': times,
        'values': [fx_for_dom],
    }];
}



const json_file_name = '.var/public/params/2024-02-15_BASE.json';
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(json_file_name, 'utf-8'));

const res = parse_params(null, data);
for (let r of res) {
    console.log(r['alias'] + ', ' + r['typename']);
}

const instr_file_name = '.difffusion/bond.json';
const cflow_file_name = '.difffusion/bond_cash_flows.json';
const instrument = JSON.parse(fs.readFileSync(instr_file_name, 'utf-8'));
const cash_flows = JSON.parse(fs.readFileSync(cflow_file_name, 'utf-8'));

const out_file_name = '.difffusion/parameters.json';
fs.writeFileSync(out_file_name, JSON.stringify(res, null, 4), 'utf-8');

const axios = require('axios');
axios.get('http://localhost:2024/api/v1/info')
    .then(resp => {
        console.log(resp.data);
        for (let obj of res) {
            axios.post('http://localhost:2024/api/v1/ops', obj, {
                headers: { 'alias': obj['alias'], 'op': 'BUILD' }
            })
            .then(resp => {
                console.log(resp.data);
            })
            .catch(error => {
                console.error(error);
            });
        }
    })
    .catch(error => {
        console.error(error);
    });

