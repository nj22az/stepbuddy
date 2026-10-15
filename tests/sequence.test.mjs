import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSequence, editSequence } from '../src/sequence.js'
import { convert, canConvert } from '../src/units.js'
const range = (values = {}) => ({ start:'0', end:'10', steps:'5', mode:'absolute', ...values })
test('five targets include both endpoints and four intervals', () => {
  const r = generateSequence(range())
  assert.deepEqual(r.map(p => p.value), [0,2.5,5,7.5,10])
  assert.deepEqual(r.map(p => p.stepSize), [0,2.5,2.5,2.5,2.5])
  assert.deepEqual(r.map(p => p.number), [1,2,3,4,5])
})
test('descending percentage sequences start at Start and finish at End', () => {
  const r = generateSequence(range({ start:'100',end:'0',mode:'percentage',percentList:['0','20','40','60','80','100'] }))
  assert.deepEqual(r.map(p => p.value), [100,80,60,40,20,0])
})
test('percentage points are deduplicated and measured along an offset span', () => {
  assert.deepEqual(generateSequence(range({start:'4',end:'20',mode:'percentage',percentList:['100','0, 25','50','75','25']})).map(p => p.value),[4,8,12,16,20])
})
test('fractional, missing, non-finite and excessive point counts are rejected', () => {
  for (const steps of ['2.5','','1','1001','1e8','Infinity']) assert.throws(() => generateSequence(range({steps})))
  for (const start of ['','Infinity','NaN','3xyz']) assert.throws(() => generateSequence(range({start})))
})
test('fractional endpoints retain full calculated precision', () => {
  const r = generateSequence(range({start:'0.00001',end:'0.00005',steps:5}))
  assert.equal(r[0].value,.00001);assert.equal(r.at(-1).value,.00005)
  assert(Math.abs(r[2].value-.00003)<1e-18)
})
test('descending and negative ranges and two-point ranges', () => {
  assert.deepEqual(generateSequence(range({start:'5',end:'-5',steps:3})).map(p=>p.value),[5,0,-5])
  assert.deepEqual(generateSequence(range({start:'10',end:'-2',steps:2})).map(p=>p.value),[10,-2])
})
test('editing an even target preserves previous targets and redistributes the tail', () => {
  const r=editSequence(generateSequence(range()),1,4,10,'absolute')
  assert.deepEqual(r.map(p=>p.value),[0,4,6,8,10])
  assert.deepEqual(r.map(p=>p.stepSize),[0,4,2,2,2])
})
test('editing a percentage target leaves all other values fixed and updates incoming intervals', () => {
  const r=editSequence(generateSequence(range({mode:'percentage',percentList:['0','25','50','75','100']})),2,6,10,'percentage')
  assert.deepEqual(r.map(p=>p.value),[0,2.5,6,7.5,10])
  assert.deepEqual(r.map(p=>p.stepSize),[0,2.5,3.5,1.5,2.5])
})
test('relevant unit conversions remain dimensionally correct', () => {
  assert.equal(convert(10,'kN','N'),10000)
  assert.equal(convert(10,'bar','kPa'),1000)
  assert(Math.abs(convert(4,'mA','A')-.004)<1e-15)
  assert.equal(canConvert('N','C'),false)
})
