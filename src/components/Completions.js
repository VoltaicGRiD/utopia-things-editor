export function thingsCompletions(monaco) {
  const snippetKind = monaco?.languages?.CompletionItemKind?.Snippet ?? 15;
  const insertAsSnippet = monaco?.languages?.CompletionItemInsertTextRule?.InsertAsSnippet ?? 4;

  return {
    suggestions: [
      {
        label: 'creature stat block',
        kind: snippetKind,
        insertTextRules: insertAsSnippet,
        insertText: [
          '/creature ${1:Creature Name}',
          '  /type ${2:Medium Beast}',
          '  /dr ${3:1 (0 XP)}',
          '  /stats ${4:10} ${5:10} ${6:10}',
          '  /bd ${7:2d4} ${8:2d12}',
          '  /travel ${9:1} ${10:1} ${11:1}',
          '  /defense ${12:1} ${13:1} ${14:1} ${15:1} ${16:1}',
          '  /agi ${17:1} ${18:1} ${19:1}',
          '  /str ${20:1} ${21:1} ${22:1}',
          '  /int ${23:1} ${24:1} ${25:1}',
          '  /wil ${26:1} ${27:1} ${28:1}',
          '  /dis ${29:1} ${30:1} ${31:1}',
          '  /cha ${32:1} ${33:1} ${34:1}',
          '  /drops ${35:1d6 Bones (Crude MC)}',
          '  /harvest ${36:TD 6 Engineering}: ${37:1d8 Wolf Hide (Crude MC)}, ${38:1d4 Fibers (Crude RC)}',
          '  /desc',
          '  ${39:This is a sample creature description. It can span multiple lines.}',
          '  /enddesc',
          '  /flavor ${40:A sample flavor text line.}',
          '/endcreature',
          '$0'
        ].join('\n'),
        documentation: 'Insert a formatted creature snippet.',
      }
    ]
  };
}