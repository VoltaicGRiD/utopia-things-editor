import { parse } from '../src/components/Parser.js';

function textOf(el) {
  return el.textContent.replace(/\s+/g, ' ').trim();
}

describe('Parser basic features', () => {
  test('parses heading and paragraph', () => {
    const src = '# Title\nThis is a *test* paragraph.';
    const doc = parse(src);
    // expect a heading then a paragraph in first column
    const h = doc.querySelector('h1');
    expect(h).not.toBeNull();
    expect(textOf(h)).toBe('Title');
    const p = doc.querySelector('p');
    expect(p.innerHTML).toContain('<em>test</em>');
  });

  test('note box and equipment parse', () => {
    const src = '/note Important\nmore text\n/end\n/equipment rare Fancy Sword\n/type Weapon\n/cost 100\n/end';
    const doc = parse(src);
    const note = doc.querySelector('.note');
    expect(note).not.toBeNull();
    expect(doc.querySelector('.equipment')).not.toBeNull();
    expect(doc.querySelector('.equipment .equipment-title').textContent).toBe('Fancy Sword');
  });

  test('image and lists and code block', () => {
    const src = '/img /path/to/img.png Alt text\n- item one\n- item two\n1. first\n2. second\n```js\nconsole.log(1)\n```';
    const doc = parse(src);
    expect(doc.querySelector('img')).not.toBeNull();
    expect(doc.querySelectorAll('ul li').length).toBe(2);
    expect(doc.querySelectorAll('ol li').length).toBe(2);
    expect(doc.querySelector('pre code')).not.toBeNull();
  });

  test('style injection', () => {
    const src = '/style begin\n.foo { color: red }\n/style end\n# hi';
    const doc = parse(src);
    const style = doc.querySelector('style');
    expect(style).not.toBeNull();
    expect(style.textContent).toContain('.foo');
  });
});
