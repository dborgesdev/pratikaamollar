export function whatsappMessage(name: string, message: string) {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  const cleanMessage = message.trim();
  if (cleanName.length < 2 || cleanName.length > 80) throw new Error('Informe seu nome (entre 2 e 80 caracteres).');
  if (cleanMessage.length < 10 || cleanMessage.length > 1500) throw new Error('Escreva uma mensagem entre 10 e 1.500 caracteres.');
  return 'https://wa.me/5517991628264?text=' + encodeURIComponent(`Olá, Pratika Amollar!\n\n*Nome:* ${cleanName}\n\n*Mensagem:*\n${cleanMessage}`);
}
