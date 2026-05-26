import { useState, useEffect, useCallback } from 'react';
import { geoterritoriosApi } from '@/api/geoterritoriosClient';

export function useTerritorios() {
  const [territorios, setTerritorios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await geoterritoriosApi.entities.Territorio.list('num', 100);
    setTerritorios(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { territorios, loading, refetch: fetch };
}

export function useCondominios() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await geoterritoriosApi.entities.Condominio.list('territorio', 5000);
    setCondominios(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { condominios, loading, refetch: fetch };
}

export function useRegistrosS13() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await geoterritoriosApi.entities.RegistroS13.list('-created_date', 1000);
    setRegistros(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { registros, loading, refetch: fetch };
}

export function getTerritorioStatus(num, registros) {
  const regs = registros.filter(r => r.territorio_num === num);
  const andamento = regs.find(r => r.status === 'em_andamento');
  if (andamento) return 'andamento';
  const concluido = regs.find(r => r.status === 'concluido');
  if (concluido) return 'concluido';
  return 'livre';
}

export function getTerritorioStats(territorios, condominios, registros) {
  const conc = territorios.filter(t => getTerritorioStatus(t.num, registros) === 'concluido').length;
  const and = territorios.filter(t => getTerritorioStatus(t.num, registros) === 'andamento').length;
  const livre = territorios.length - conc - and;

  const totalAptos = condominios.reduce((s, c) => s + (c.total_aptos || 0), 0);
  const totalCartas = condominios.reduce((s, c) => s + (c.cartas_enviadas || 0), 0);
  const pctCartas = totalAptos > 0 ? Math.round((totalCartas / totalAptos) * 100) : 0;

  const totalConvCel = registros.reduce((s, r) => s + (r.conv_celebracao || 0), 0);
  const totalConvCong = registros.reduce((s, r) => s + (r.conv_congresso || 0), 0);

  return { conc, and, livre, totalConds: condominios.length, totalAptos, totalCartas, pctCartas, totalConvCel, totalConvCong };
}