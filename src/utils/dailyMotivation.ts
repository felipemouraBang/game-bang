import { supabase } from '../db/supabase.js';

const MOTIVATIONS = {
  1: [ // Segunda-feira
    "Segunda é o começo de uma nova chance para fazer melhor.",
    "Hoje é o dia perfeito para dar o primeiro passo.",
    "Comece a semana com foco e termine com orgulho.",
    "A disciplina de hoje é o sucesso de amanhã.",
    "Não reclame da segunda, domine ela.",
    "Grandes conquistas começam com pequenas atitudes.",
    "Faça desta semana a melhor da sua vida.",
    "Segunda é dia de recomeçar com mais força.",
    "O sucesso começa quando você decide tentar.",
    "Acredite: você é capaz de muito mais do que imagina."
  ],
  2: [ // Terça-feira
    "Continue firme, você já começou.",
    "Persistência é o caminho para a vitória.",
    "Cada esforço conta. Não desista agora.",
    "Foque no progresso, não na perfeição.",
    "Seu futuro agradece o esforço de hoje.",
    "Mantenha o ritmo e a confiança.",
    "Pequenos passos também levam longe.",
    "Desafios são oportunidades disfarçadas.",
    "Faça o seu melhor com o que você tem.",
    "Seja mais forte que suas desculpas."
  ],
  3: [ // Quarta-feira
    "Metade da semana já foi, você consegue!",
    "Continue avançando, mesmo que devagar.",
    "A constância vence a pressa.",
    "O esforço silencioso gera resultados grandiosos.",
    "Não pare até se orgulhar.",
    "Sua dedicação faz a diferença.",
    "Acredite no processo.",
    "Você está mais perto do que imagina.",
    "Transforme obstáculos em aprendizado.",
    "Continue, seu sonho vale a pena."
  ],
  4: [ // Quinta-feira
    "Já está quase lá, mantenha o foco.",
    "A vitória é construída dia após dia.",
    "Confie na sua capacidade.",
    "Seja determinado, não apenas motivado.",
    "O sucesso exige coragem.",
    "Não desacelere agora.",
    "Faça hoje valer a pena.",
    "Você é mais forte do que pensa.",
    "Trabalhe duro em silêncio, deixe o sucesso falar.",
    "A disciplina supera o cansaço."
  ],
  5: [ // Sexta-feira
    "Termine a semana com orgulho do que fez.",
    "Celebre suas pequenas conquistas.",
    "Você venceu mais uma semana!",
    "Finalize forte, como um campeão.",
    "Gratidão pelo progresso alcançado.",
    "Sexta é dia de reconhecer seu esforço.",
    "Feche a semana com energia positiva.",
    "O descanso é merecido quando o trabalho foi feito.",
    "Continue plantando para colher grandes frutos.",
    "Você merece tudo aquilo pelo que lutou."
  ]
};

export async function checkAndSendDailyMotivation(userId: number) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dateStr = today.toISOString().split('T')[0];

  // Only send on weekdays (Monday to Friday)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    // Check if a daily motivation was already sent today for this user
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'daily_motivation')
      .gte('created_at', `${dateStr}T00:00:00Z`)
      .lte('created_at', `${dateStr}T23:59:59Z`)
      .maybeSingle();

    if (!existing) {
      // Determine which message to send based on the week of the year
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const pastDaysOfYear = (today.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
      
      const messagesForDay = MOTIVATIONS[dayOfWeek as keyof typeof MOTIVATIONS];
      const messageIndex = weekNumber % messagesForDay.length;
      const message = messagesForDay[messageIndex];

      // Insert notification
      await supabase.from('notifications').insert({
        user_id: userId,
        message,
        type: 'daily_motivation',
        read: false
      });
    }
  }
}
