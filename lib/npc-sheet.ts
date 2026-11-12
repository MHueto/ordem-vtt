export const attributes = ['Agilidade', 'Força', 'Intelecto', 'Presença', 'Vigor'] as const;
export const skillNames = ['Acrobacia', 'Adestramento', 'Artes', 'Atletismo', 'Atualidades', 'Ciências', 'Crime', 'Diplomacia', 'Enganação', 'Fortitude', 'Furtividade', 'Iniciativa', 'Intimidação', 'Intuição', 'Investigação', 'Luta', 'Medicina', 'Ocultismo', 'Percepção', 'Pilotagem', 'Pontaria', 'Profissão', 'Reflexos', 'Religião', 'Sobrevivência', 'Tática', 'Tecnologia', 'Vontade'];
export type Resource = { current: number; max: number };
export type Skill = { name: string; training: number; bonus: number };
export type Ritual = { id: string; name: string; element: string; circle: string; cost: number; execution: string; range: string; duration: string; description: string };
export type Item = { id: string; name: string; quantity: number; slots: number; equipped: boolean; description: string };
export type Attack = { id: string; name: string; test: string; damage: string; range: string; critical: string; description: string };
export type NpcSheet = {
  version: 1; origin: string; className: string; trail: string; nex: number;
  attributes: Record<typeof attributes[number], number>;
  life: Resource; effort: Resource; sanity: Resource; determination: Resource;
  defense: number; movement: number; medical: number; conditions: string;
  skills: Skill[]; rituals: Ritual[]; inventory: Item[]; attacks: Attack[];
  abilities: string; resistances: string; capacity: number;
};
export function emptySheet(): NpcSheet {
  return { version: 1, origin: '', className: '', trail: '', nex: 0,
    attributes: { Agilidade: 1, Força: 1, Intelecto: 1, Presença: 1, Vigor: 1 },
    life: { current: 0, max: 0 }, effort: { current: 0, max: 0 }, sanity: { current: 0, max: 0 }, determination: { current: 0, max: 0 },
    defense: 0, movement: 0, medical: 0, conditions: '', skills: skillNames.map(name => ({ name, training: 0, bonus: 0 })),
    rituals: [], inventory: [], attacks: [], abilities: '', resistances: '', capacity: 0 };
}
export function inventorySlots(items: Item[]) { return Math.round(items.reduce((total, item) => total + item.quantity * item.slots, 0) * 100) / 100; }
export function changeResource(resource: Resource, delta: number): Resource { return { ...resource, current: Math.max(0, Math.min(resource.max, resource.current + delta)) }; }
export function validateSheet(sheet: NpcSheet): string | null {
  const within = (n: number, min = 0, max = 99999, integer = true) => Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n));
  if (!within(sheet.nex, 0, 100) || Object.values(sheet.attributes).some(n => !within(n, 0, 99))) return 'Confira o NEX (0 a 100) e os atributos (0 a 99): use números inteiros.';
  if (![sheet.defense, sheet.medical].every(n => within(n)) || !within(sheet.movement, 0, 99999, false) || !within(sheet.capacity, 0, 99999, false)) return 'Defesa, assistência médica, deslocamento e capacidade devem ser números positivos ou zero.';
  if (sheet.skills.some(s => !within(s.training, -99, 999) || !within(s.bonus, -999, 999))) return 'Confira treino e bônus das perícias: use números inteiros entre -99 e 999 para treino e -999 a 999 para bônus.';
  if (sheet.inventory.some(i => !within(i.quantity) || !within(i.slots, 0, 99999, false)) || sheet.rituals.some(r => !within(r.cost))) return 'Confira quantidades, espaços e custos: use valores de zero a 99999.';
  for (const [label, resource] of [['Vida', sheet.life], ['Esforço', sheet.effort], ['Sanidade', sheet.sanity], ['Determinação', sheet.determination]] as const) {
    if (![resource.current, resource.max].every(n => within(n)) || resource.current > resource.max) return `${label}: o valor atual deve ficar entre zero e o máximo (até 99999).`;
  }
  if (sheet.nex < 0 || sheet.nex > 100) return 'O NEX deve ficar entre 0 e 100.';
  if (sheet.rituals.some(r => !r.name.trim()) || sheet.inventory.some(i => !i.name.trim()) || sheet.attacks.some(a => !a.name.trim()) || sheet.skills.some(s => !s.name.trim())) return 'Preencha os nomes dos rituais, itens, ataques e perícias adicionados.';
  if (sheet.inventory.some(i => i.quantity < 0 || !Number.isInteger(i.quantity) || i.slots < 0) || sheet.rituals.some(r => !Number.isInteger(r.cost) || r.cost < 0)) return 'Confira as quantidades, os espaços e os custos: não podem ser negativos.';
  return null;
}
