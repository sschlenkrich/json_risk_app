function parse_instrument(instrument, cash_flows) {
    let cfs, notionals;
    if (instrument['type'] === 'bond') {
        [cfs, notionals] = parse_bond_cash_flows(instrument, cash_flows);
    }
    if (instrument['type'] === 'floater') {
        [cfs, notionals] = parse_floater_cash_flows(instrument, cash_flows);
    }
    
    const alias = 'leg/' + instrument['id'];
    const curve_key = instrument['currency'];
    let fx_key = "nothing";
    if (instrument['currency'] !== 'EUR') {
        fx_key = instrument['currency'] + '-EUR';
    }
    const payer_receiver = 1.0;
    return [{
        'typename': 'DiffFusion.DeterministicCashFlowLeg',
        'constructor': 'cashflow_leg',
        'alias': alias,
        'cashflows': cfs,
        'notionals': notionals,
        'curve_key': curve_key,
        'fx_key': fx_key,
        'payer_receiver': payer_receiver,
    }];
}

function parse_bond_cash_flows(instrument, cash_flows) {
    console.log('Parse bond...');
    var initial_notional = instrument['notional'];
    assert(initial_notional > 0);
    var pay_times = cash_flows['cashflowtable']['t_pmt'];
    var amounts = cash_flows['cashflowtable']['pmt_total'];
    var cfs = [];
    var notionals = [];
    for (var i = 0; i < pay_times.length; i++) {
        var pay_time = pay_times[i];
        var amount = amounts[i];
        if (pay_time > 0) {
            var cf = {
                'typename': 'DiffFusion.FixedCashFlow',
                'constructor': 'FixedCashFlow',
                'pay_time': pay_time,
                'amount': amount / initial_notional,
            };
            cfs.push(cf);
            notionals.push(initial_notional);
        }
    }
    
    return [cfs, notionals];
}

function parse_floater_cash_flows(instrument, cash_flows) {
    console.log('Parse floater...');
    var pay_times = cash_flows['cashflowtable']['t_pmt'];
    var cfs = [];
    var notionals = [];
    for (var k = 0; k < pay_times.length; k++) {
        var pay_time = pay_times[k];
        if (pay_time <= 0) {
            continue;
        }
        if (!cash_flows['cashflowtable']['is_interest_date'][k]) {
            var amount = cash_flows['cashflowtable']['pmt_principal'][k];
            if (amount == 0) {
                continue;
            }
            cfs.push({
                'typename': 'DiffFusion.FixedCashFlow',
                'constructor': 'FixedCashFlow',
                'pay_time': pay_time,
                'amount': amount / Math.abs(amount),
            });
            notionals.push(Math.abs(amount));
        } else {
            var notional = cash_flows['cashflowtable']['current_principal'][k];
            assert(notional > 0);
            var amount = cash_flows['cashflowtable']['pmt_principal'][k];
            if (amount != 0) {
                cfs.push({
                    'typename': 'DiffFusion.FixedCashFlow',
                    'constructor': 'FixedCashFlow',
                    'pay_time': pay_time,
                    'amount': amount / notional,
                });
                notionals.push(notional);
            }
            var fixing_time = cash_flows['cashflowtable']['t_accrual_start'][k];
            if (fixing_time <= 0.0) {
                var cf = {
                    'typename': 'DiffFusion.FixedRateCoupon',
                    'constructor': 'FixedRateCoupon',
                    'pay_time': pay_time,
                    'fixed_rate': instrument['float_current_rate'] + instrument['float_spread'],
                    'first_time': cash_flows['cashflowtable']['t_accrual_start'][k],
                };
            } else {
                var curve_key = instrument['currency'] + ':IBOR';
                var cf = {
                    'typename': 'DiffFusion.SimpleRateCoupon',
                    'constructor': 'SimpleRateCoupon',
                    'fixing_time': fixing_time,
                    'start_time': cash_flows['cashflowtable']['t_accrual_start'][k],
                    'end_time': cash_flows['cashflowtable']['t_accrual_end'][k],
                    'pay_time': pay_time,
                    'year_fraction': cash_flows['cashflowtable']['accrual_factor'][k],
                    'curve_key': curve_key,
                    'fixing_key': "nothing",
                    'spread_rate': instrument['float_spread'],
                };
            }
            cfs.push(cf);
            notionals.push(notional);
        }
    }
    return [cfs, notionals];
}

const res = [];
const instr_file_name = '.difffusion/bond.json';
const cflow_file_name = '.difffusion/bond_cash_flows.json';
const instrument = require(instr_file_name);
const cash_flows = require(cflow_file_name);
res.push(...parse_instrument(instrument, cash_flows));

const instr_file_name = '.difffusion/floater_1.json';
const cflow_file_name = '.difffusion/floater_1_cash_flows.json';
const instrument = require(instr_file_name);
const cash_flows = require(cflow_file_name);
res.push(...parse_instrument(instrument, cash_flows));

const instr_file_name = '.difffusion/floater_2.json';
const cflow_file_name = '.difffusion/floater_2_cash_flows.json';
const instrument = require(instr_file_name);
const cash_flows = require(cflow_file_name);
res.push(...parse_instrument(instrument, cash_flows));

for (const r of res) {
    console.log(r['alias'] + ', ' + r['typename']);
}

const out_file_name = '.difffusion/instruments.json';
const fs = require('fs');
fs.writeFileSync(out_file_name, JSON.stringify(res, null, 4), 'utf-8');

const axios = require('axios');
axios.get('http://localhost:2024/api/v1/info')
    .then(resp => {
        console.log(resp);
        for (const obj of res) {
            axios.post(
                'http://localhost:2024/api/v1/ops',
                obj,
                { headers: { 'alias': obj['alias'], 'op': 'BUILD' } }
            )
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

