export const getReceptionistUnits = (nickname: string): string[] => {
  switch (nickname) {
    case 'Forte Muaythai': return ['Forte Muay'];
    case 'Forte Fitness': return ['Forte Fitness'];
    case 'Forte Fight': return ['Forte Fight'];
    case 'Anita': return ['Anita Muay', 'Anita Fitness'];
    case 'Moinhos': return ['Moinhos Muay', 'Moinhos Fitness'];
    case 'Protásio': return ['Protásio Fitness', 'Protásio Fight', 'Protásio Muay'];
    case 'Zona Sul': return ['ZS Muay', 'ZS Fitness'];
    case 'Tramandai': return ['Tramandai Muay'];
    case 'Canoas': return ['Canoas Muaythai', 'Canoas Fitness'];
    case 'Canoas Igara': return ['Canoas Igara'];
    case 'Zona Leste': return ['Cristiano Muay', 'Cristiano Fitness'];
    case 'Cachoeirinha': return ['Cachoeirinha'];
    default: return nickname ? [nickname] : [];
  }
};
