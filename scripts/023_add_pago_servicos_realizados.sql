-- Adicionar campo 'pago' na tabela servicos_realizados
-- Este campo indica se o serviço foi pago antecipadamente no PDV

ALTER TABLE servicos_realizados
ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE;

-- Adicionar comentário explicativo
COMMENT ON COLUMN servicos_realizados.pago IS 'Indica se o serviço foi pago antecipadamente no PDV (TRUE) ou se o pagamento será feito após conclusão (FALSE)';
