import { useState, type FormEvent } from 'react';
import { ArrowUpRight, MessageCircle, Check } from 'lucide-react';
import { whatsappMessage } from '../lib/contact';
export default function ContactForm() {
  const [name, setName] = useState(''), [message, setMessage] = useState(''), [error, setError] = useState(''), [ready, setReady] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setReady('');
    try {
      const url = whatsappMessage(name, message);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      void opened;
      setReady(url);
    } catch (e) { setError((e as Error).message); }
  }
  return <form className="contact-form" onSubmit={submit}><span className="eyebrow">Direto para nossa equipe</span><h2>Como podemos<br/>ajudar você?</h2><p>Conte o que você precisa. A conversa continua pelo WhatsApp.</p><label htmlFor="contact-name">Seu nome<input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Como podemos chamar você?" value={name} onChange={e => { setName(e.target.value); setReady(''); }}/></label><label htmlFor="contact-message">Sua mensagem<textarea id="contact-message" name="message" required minLength={10} maxLength={1500} rows={5} placeholder="Quero saber mais sobre…" value={message} onChange={e => { setMessage(e.target.value); setReady(''); }}/></label><span className="field-hint">{message.length}/1.500 caracteres</span><button className="button" type="submit">Enviar pelo WhatsApp <MessageCircle size={20}/></button><small>O WhatsApp abrirá com seu nome e mensagem. Confirme o envio na conversa.</small>{error && <p className="error" role="alert">{error}</p>}{ready && <div className="contact-success" role="status"><Check size={19}/><div>Mensagem preparada. <a href={ready} target="_blank" rel="noopener noreferrer">Abrir conversa <ArrowUpRight size={15}/></a></div></div>}</form>;
}
