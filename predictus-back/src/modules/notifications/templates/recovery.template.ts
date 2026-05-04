export function recoveryTemplate(resumeUrl: string) {
  return {
    subject: 'Continue seu cadastro',
    html: `<p>Você começou um cadastro mas não finalizou.</p>
           <p><a href="${resumeUrl}">Clique aqui para continuar</a></p>`,
    text: `Continue seu cadastro: ${resumeUrl}`,
  };
}