const CHAVE_TENTATIVAS = "selleta-login-attempts";
export const LIMITE_TENTATIVAS_LOGIN = 5;
export const JANELA_BLOQUEIO_LOGIN_MS = 15 * 60 * 1000;

function armazenamentoPadrao(armazenamento) {
  return armazenamento || globalThis.localStorage;
}

function estadoVazio() {
  return { tentativas: 0, bloqueadoAte: 0 };
}

function lerEstado(armazenamento, agora) {
  try {
    const storage = armazenamentoPadrao(armazenamento);
    const estado = JSON.parse(storage?.getItem(CHAVE_TENTATIVAS));

    if (!estado || Number(estado.bloqueadoAte) <= agora) {
      storage?.removeItem(CHAVE_TENTATIVAS);
      return estadoVazio();
    }

    return {
      tentativas: Math.max(0, Number(estado.tentativas) || 0),
      bloqueadoAte: Number(estado.bloqueadoAte),
    };
  } catch {
    return estadoVazio();
  }
}

function resumirEstado(estado, agora) {
  const bloqueado =
    estado.tentativas >= LIMITE_TENTATIVAS_LOGIN &&
    estado.bloqueadoAte > agora;

  return {
    bloqueado,
    tentativasRestantes: Math.max(
      0,
      LIMITE_TENTATIVAS_LOGIN - estado.tentativas
    ),
    minutosRestantes: bloqueado
      ? Math.max(1, Math.ceil((estado.bloqueadoAte - agora) / 60000))
      : 0,
  };
}

export function consultarBloqueioLogin(
  armazenamento,
  agora = Date.now()
) {
  return resumirEstado(lerEstado(armazenamento, agora), agora);
}

export function registrarFalhaLogin(
  armazenamento,
  agora = Date.now()
) {
  const storage = armazenamentoPadrao(armazenamento);
  const atual = lerEstado(storage, agora);
  const proximo = {
    tentativas: atual.tentativas + 1,
    bloqueadoAte: agora + JANELA_BLOQUEIO_LOGIN_MS,
  };

  try {
    storage?.setItem(CHAVE_TENTATIVAS, JSON.stringify(proximo));
  } catch {
    return resumirEstado(proximo, agora);
  }

  return resumirEstado(proximo, agora);
}

export function limparFalhasLogin(armazenamento) {
  try {
    armazenamentoPadrao(armazenamento)?.removeItem(CHAVE_TENTATIVAS);
  } catch {
    // O limite do Supabase continua ativo se o navegador bloquear o storage.
  }
}

export async function registrarSessaoAtual(clienteSupabase) {
  const { data, error } = await clienteSupabase.rpc(
    "register_current_session"
  );
  return !error && data === true;
}
