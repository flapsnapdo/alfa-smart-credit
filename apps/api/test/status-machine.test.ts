import { describe, expect, it } from 'vitest';
import {
  assertTransition, canTransition, FINAL_STATUSES, InvalidTransitionError, TRANSITIONS,
} from '../src/applications/status-machine';

describe('машина состояний заявки', () => {
  it('счастливый путь: от черновика до выдачи', () => {
    expect(canTransition('DRAFT', 'SUBMITTED', 'CLIENT')).toBe(true);
    expect(canTransition('SUBMITTED', 'VALIDATION', 'SYSTEM')).toBe(true);
    expect(canTransition('VALIDATION', 'ENRICHMENT', 'SYSTEM')).toBe(true);
    expect(canTransition('ENRICHMENT', 'SCORING', 'SYSTEM')).toBe(true);
    expect(canTransition('SCORING', 'APPROVED', 'SYSTEM')).toBe(true);
    expect(canTransition('APPROVED', 'SIGNING', 'CLIENT')).toBe(true);
    expect(canTransition('SIGNING', 'ISSUED', 'SYSTEM')).toBe(true);
  });

  it('нельзя перепрыгнуть этапы: черновик сразу в «одобрено»', () => {
    expect(canTransition('DRAFT', 'APPROVED', 'CLIENT')).toBe(false);
    expect(canTransition('DRAFT', 'APPROVED', 'SYSTEM')).toBe(false);
  });

  it('клиент не может сам себе одобрить заявку', () => {
    expect(canTransition('SCORING', 'APPROVED', 'CLIENT')).toBe(false);
    expect(canTransition('MANUAL_REVIEW', 'APPROVED', 'CLIENT')).toBe(false);
  });

  it('решение в ручном рассмотрении принимает только аналитик', () => {
    expect(canTransition('MANUAL_REVIEW', 'APPROVED', 'ANALYST')).toBe(true);
    expect(canTransition('MANUAL_REVIEW', 'APPROVED', 'SYSTEM')).toBe(false);
  });

  it('из финальных статусов выхода нет', () => {
    for (const s of FINAL_STATUSES) expect(TRANSITIONS[s]).toHaveLength(0);
  });

  it('отозвать заявку можно до подписания, но не после выдачи', () => {
    expect(canTransition('COUNTER_OFFER', 'CANCELLED', 'CLIENT')).toBe(true);
    expect(canTransition('SIGNING', 'CANCELLED', 'CLIENT')).toBe(false);
    expect(canTransition('ISSUED', 'CANCELLED', 'CLIENT')).toBe(false);
  });

  it('assertTransition бросает понятную ошибку', () => {
    expect(() => assertTransition('DRAFT', 'ISSUED', 'CLIENT')).toThrow(InvalidTransitionError);
    expect(() => assertTransition('DRAFT', 'SUBMITTED', 'CLIENT')).not.toThrow();
  });
});