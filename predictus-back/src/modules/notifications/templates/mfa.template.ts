export function mfaTemplate(code: string) {
  return {
    subject: `Seu código de verificação: ${code}`,
    html: `<p>Olá!</p><p>Seu código de verificação é: <strong style="font-size: 24px">${code}</strong></p>
           <p>Ele expira em 10 minutos.</p>`,
    text: `Seu código de verificação é: ${code}\nExpira em 10 minutos.`,
  };
}