export function rollDice(expression: string): { result: number, detail: string } {
  const regex = /^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i;
  const match = expression.match(regex);

  if (!match) throw new Error("Expressão de dado inválida. Use o formato XdY ou XdY+Z");

  const numDice = parseInt(match[1]);
  const diceSides = parseInt(match[2]);
  const operator = match[3];
  const modifier = operator ? parseInt(match[4]) : 0;

  let total = 0;
  const rolls: number[] = [];

  for (let i = 0; i < numDice; i++) {
    const r = Math.floor(Math.random() * diceSides) + 1;
    rolls.push(r);
    total += r;
  }

  const finalResult = operator === '-' ? total - modifier : total + modifier;

  return {
    result: finalResult,
    detail: `(${rolls.join(' + ')}) ${operator ? operator + modifier : ''} = ${finalResult}`
  };
}

export function calculatePatente(nex: number): string {
  if (nex <= 5) return "Recruta";
  if (nex <= 20) return "Operador";
  if (nex <= 50) return "Agente";
  if (nex <= 80) return "Especialista";
  return "Veterano";
}
