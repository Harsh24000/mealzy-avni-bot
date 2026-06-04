import { InlineKeyboard } from 'grammy';

export function buildButtonsKeyboard(options) {
  const kb = new InlineKeyboard();
  options.forEach((opt, i) => {
    kb.text(opt, `btn:${opt}`);
    if ((i + 1) % 3 === 0) kb.row();
  });
  return kb;
}

export function buildScaleKeyboard() {
  const kb = new InlineKeyboard();
  for (let i = 1; i <= 10; i++) {
    kb.text(String(i), `btn:${i}`);
  }
  return kb;
}

export function buildMultiselectKeyboard(options, selected) {
  const kb = new InlineKeyboard();
  options.forEach((opt, i) => {
    const checked = selected.includes(opt);
    kb.text((checked ? '✓ ' : '') + opt, `ms:${opt}`);
    if ((i + 1) % 2 === 0) kb.row();
  });
  kb.row().text('Done ✓', 'ms_done');
  return kb;
}
