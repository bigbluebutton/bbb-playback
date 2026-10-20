import { getCandidates } from './videojsLanguage';

describe('getCandidates', () => {
  it('tries the regional variant first', () => {
    expect(getCandidates('pt-BR')).toEqual(['pt-BR', 'pt', 'pt-PT']);
    expect(getCandidates('zh_TW')).toEqual(['zh-TW', 'zh', 'zh-CN']);
    expect(getCandidates('fa-IR')).toEqual(['fa-IR', 'fa']);
  });

  it('handles plain languages', () => {
    expect(getCandidates('ar')).toEqual(['ar']);
    expect(getCandidates('')).toEqual([]);
  });
});
