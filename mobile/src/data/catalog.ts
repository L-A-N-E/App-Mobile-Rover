import { ImageSourcePropType } from 'react-native';

import { getLanguage, t } from '../i18n';
import { monthsShort } from '../utils/dates';
import { destinationTexts, placeNames, tagNames } from './catalogI18n';

// Catálogo local de destinos e pontos de interesse (com coordenadas reais),
// usado enquanto a API não estiver pronta. Os textos abaixo são a versão em português;
// as traduções ficam em catalogI18n.ts e são aplicadas no fim do arquivo.

// Valores internos (salvos nas viagens e enviados à IA); na tela use categoryLabel.
export type Category = 'Cultura' | 'Gastronomia' | 'Natureza' | 'Vida Noturna';

export const categories: Category[] = ['Cultura', 'Gastronomia', 'Natureza', 'Vida Noturna'];

export const categoryLabel = (category: Category) => t(`category.${category}`);

export const categoryIcons: Record<Category, 'bank-outline' | 'silverware-fork-knife' | 'pine-tree' | 'glass-cocktail'> = {
  Cultura: 'bank-outline',
  Gastronomia: 'silverware-fork-knife',
  Natureza: 'pine-tree',
  'Vida Noturna': 'glass-cocktail',
};

export type Place = {
  id: string;
  cityId: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  durationMin: number;
  image?: ImageSourcePropType;
  source?: 'ai';
  reason?: string;
  outdoor?: boolean; // atividade ao ar livre (sensível ao clima)
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  image: ImageSourcePropType;
  tagline: string;
  description: string;
  tags: string[];
  bestSeason: string;
  budget: 1 | 2 | 3;
  rating: number;
};

export const destinations: Destination[] = [
  {
    id: 'madri',
    name: 'Madri',
    country: 'Espanha',
    image: require('../../assets/images/madri.jpg'),
    tagline: 'Museus de classe mundial e tapas até tarde',
    description: 'Capital vibrante com o Triângulo da Arte, parques enormes e uma vida noturna que começa depois da meia-noite.',
    tags: ['Cultura', 'Gastronomia', 'Vida Noturna'],
    bestSeason: 'Abr – Jun',
    budget: 2,
    rating: 4.7,
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Espanha',
    image: require('../../assets/images/barcelona.jpg'),
    tagline: 'Gaudí, praia e mercado no mesmo dia',
    description: 'Arquitetura modernista, bairros medievais e praias urbanas em uma cidade feita para caminhar.',
    tags: ['Cultura', 'Praia', 'Arquitetura'],
    bestSeason: 'Mai – Set',
    budget: 2,
    rating: 4.8,
  },
  {
    id: 'lisboa',
    name: 'Lisboa',
    country: 'Portugal',
    image: require('../../assets/images/destinations/lisboa.jpg'),
    tagline: 'Miradouros, bondinhos e pastel de nata',
    description: 'Sete colinas, fado nas vielas de Alfama e o pôr do sol mais bonito da Europa à beira do Tejo.',
    tags: ['Cultura', 'Gastronomia', 'Mirantes'],
    bestSeason: 'Mar – Out',
    budget: 1,
    rating: 4.8,
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'França',
    image: require('../../assets/images/destinations/paris.jpg'),
    tagline: 'Arte, cafés e a Torre Eiffel iluminada',
    description: 'Do Louvre a Montmartre, cada bairro tem seu ritmo. Perfeita para casais e amantes de museus.',
    tags: ['Romântico', 'Arte', 'Gastronomia'],
    bestSeason: 'Abr – Jun',
    budget: 3,
    rating: 4.7,
  },
  {
    id: 'roma',
    name: 'Roma',
    country: 'Itália',
    image: require('../../assets/images/destinations/roma.jpg'),
    tagline: '2.000 anos de história a cada esquina',
    description: 'Coliseu, Vaticano e massas inesquecíveis. Um museu a céu aberto que se explora a pé.',
    tags: ['História', 'Gastronomia', 'Cultura'],
    bestSeason: 'Abr – Jun',
    budget: 2,
    rating: 4.8,
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japão',
    image: require('../../assets/images/destinations/kyoto.jpg'),
    tagline: 'Templos dourados e bambuzais silenciosos',
    description: 'A antiga capital do Japão reúne mais de mil templos, jardins zen e a tradição das gueixas em Gion.',
    tags: ['Templos', 'Natureza', 'Tradição'],
    bestSeason: 'Mar – Mai',
    budget: 2,
    rating: 4.9,
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    country: 'Brasil',
    image: require('../../assets/images/destinations/rio.jpg'),
    tagline: 'Praia, montanha e samba na Cidade Maravilhosa',
    description: 'Cristo Redentor, Pão de Açúcar e o pôr do sol no Arpoador. Natureza e cidade lado a lado.',
    tags: ['Praia', 'Natureza', 'Vida Noturna'],
    bestSeason: 'Mai – Out',
    budget: 1,
    rating: 4.6,
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Grécia',
    image: require('../../assets/images/destinations/santorini.jpg'),
    tagline: 'Casas brancas e o pôr do sol de Oia',
    description: 'Ilha vulcânica com vilarejos no penhasco, praias de areia vermelha e vinícolas com vista para o Egeu.',
    tags: ['Romântico', 'Praia', 'Mirantes'],
    bestSeason: 'Mai – Set',
    budget: 3,
    rating: 4.8,
  },
  {
    id: 'nova-york',
    name: 'Nova York',
    country: 'Estados Unidos',
    image: require('../../assets/images/destinations/nova-york.jpg'),
    tagline: 'A cidade que nunca dorme',
    description: 'Broadway, Central Park e arranha-céus icônicos. Cada bairro parece uma cidade diferente.',
    tags: ['Urbano', 'Arte', 'Compras'],
    bestSeason: 'Set – Nov',
    budget: 3,
    rating: 4.7,
  },
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    country: 'Argentina',
    image: require('../../assets/images/destinations/buenos-aires.jpg'),
    tagline: 'Tango, parrilla e arquitetura europeia',
    description: 'Cafés históricos, San Telmo aos domingos e jantares que começam às 22h.',
    tags: ['Gastronomia', 'Cultura', 'Vida Noturna'],
    bestSeason: 'Mar – Mai',
    budget: 1,
    rating: 4.6,
  },
];

const p = (
  cityId: string,
  id: string,
  name: string,
  category: Category,
  lat: number,
  lng: number,
  durationMin: number,
  image?: ImageSourcePropType,
): Place => ({ id: `${cityId}-${id}`, cityId, name, category, lat, lng, durationMin, image });

export const places: Place[] = [
  // Madri
  p('madri', 'palacio-real', 'Palácio Real de Madrid', 'Cultura', 40.418, -3.7143, 90, require('../../assets/images/palacio-real.jpg')),
  p('madri', 'museu-naval', 'Museu Naval de Madrid', 'Cultura', 40.417, -3.6929, 60, require('../../assets/images/museu-naval.jpg')),
  p('madri', 'museu-historia', 'Museu da História de Madrid', 'Cultura', 40.4257, -3.7009, 60, require('../../assets/images/museu-historia.jpg')),
  p('madri', 'prado', 'Museu do Prado', 'Cultura', 40.4138, -3.6921, 120),
  p('madri', 'reina-sofia', 'Museu Reina Sofía', 'Cultura', 40.4086, -3.6943, 90),
  p('madri', 'plaza-mayor', 'Plaza Mayor', 'Cultura', 40.4155, -3.7074, 30),
  p('madri', 'san-miguel', 'Mercado de San Miguel', 'Gastronomia', 40.4154, -3.709, 45),
  p('madri', 'san-gines', 'Chocolatería San Ginés', 'Gastronomia', 40.4168, -3.7068, 30),
  p('madri', 'retiro', 'Parque del Retiro', 'Natureza', 40.4153, -3.6845, 90),
  p('madri', 'debod', 'Templo de Debod', 'Natureza', 40.424, -3.7177, 40),
  p('madri', 'kapital', 'Teatro Kapital', 'Vida Noturna', 40.4103, -3.6934, 120),
  p('madri', 'malasana', 'Bares de Malasaña', 'Vida Noturna', 40.4265, -3.7045, 120),
  // Barcelona
  p('barcelona', 'sagrada', 'Sagrada Família', 'Cultura', 41.4036, 2.1744, 90),
  p('barcelona', 'park-guell', 'Park Güell', 'Natureza', 41.4145, 2.1527, 75),
  p('barcelona', 'batllo', 'Casa Batlló', 'Cultura', 41.3916, 2.1649, 60),
  p('barcelona', 'pedrera', 'Casa Milà (La Pedrera)', 'Cultura', 41.3953, 2.162, 60),
  p('barcelona', 'gotic', 'Bairro Gótico', 'Cultura', 41.384, 2.1762, 60),
  p('barcelona', 'boqueria', 'Mercado La Boqueria', 'Gastronomia', 41.3817, 2.1716, 45),
  p('barcelona', 'barceloneta', 'Praia da Barceloneta', 'Natureza', 41.3784, 2.1925, 90),
  p('barcelona', 'montjuic', 'Montjuïc', 'Natureza', 41.3636, 2.165, 90),
  p('barcelona', 'born', 'Bares do El Born', 'Vida Noturna', 41.3851, 2.1825, 120),
  // Lisboa
  p('lisboa', 'belem', 'Torre de Belém', 'Cultura', 38.6916, -9.216, 45),
  p('lisboa', 'jeronimos', 'Mosteiro dos Jerónimos', 'Cultura', 38.6979, -9.2068, 75),
  p('lisboa', 'pasteis', 'Pastéis de Belém', 'Gastronomia', 38.6975, -9.2032, 30),
  p('lisboa', 'castelo', 'Castelo de São Jorge', 'Cultura', 38.7139, -9.1335, 75),
  p('lisboa', 'comercio', 'Praça do Comércio', 'Cultura', 38.7075, -9.1364, 30),
  p('lisboa', 'alfama', 'Alfama e Miradouros', 'Natureza', 38.7114, -9.13, 60),
  p('lisboa', 'timeout', 'Time Out Market', 'Gastronomia', 38.7069, -9.1458, 60),
  p('lisboa', 'bairro-alto', 'Bairro Alto', 'Vida Noturna', 38.7131, -9.1446, 120),
  // Paris
  p('paris', 'eiffel', 'Torre Eiffel', 'Cultura', 48.8584, 2.2945, 90),
  p('paris', 'louvre', 'Museu do Louvre', 'Cultura', 48.8606, 2.3376, 150),
  p('paris', 'notre-dame', 'Notre-Dame', 'Cultura', 48.853, 2.3499, 45),
  p('paris', 'montmartre', 'Montmartre e Sacré-Cœur', 'Cultura', 48.8867, 2.3431, 90),
  p('paris', 'orsay', "Museu d'Orsay", 'Cultura', 48.86, 2.3266, 90),
  p('paris', 'luxembourg', 'Jardim de Luxemburgo', 'Natureza', 48.8462, 2.3372, 60),
  p('paris', 'marais', 'Le Marais', 'Gastronomia', 48.8566, 2.3622, 60),
  p('paris', 'moulin', 'Moulin Rouge', 'Vida Noturna', 48.8841, 2.3322, 120),
  // Roma
  p('roma', 'coliseu', 'Coliseu', 'Cultura', 41.8902, 12.4922, 90),
  p('roma', 'forum', 'Fórum Romano', 'Cultura', 41.8925, 12.4853, 75),
  p('roma', 'panteao', 'Panteão', 'Cultura', 41.8986, 12.4769, 30),
  p('roma', 'trevi', 'Fontana di Trevi', 'Cultura', 41.9009, 12.4833, 20),
  p('roma', 'vaticano', 'Basílica de São Pedro', 'Cultura', 41.9022, 12.4539, 120),
  p('roma', 'navona', 'Piazza Navona', 'Gastronomia', 41.8992, 12.4731, 45),
  p('roma', 'borghese', 'Villa Borghese', 'Natureza', 41.9142, 12.4923, 75),
  p('roma', 'trastevere', 'Trastevere', 'Vida Noturna', 41.8897, 12.4697, 120),
  // Kyoto
  p('kyoto', 'fushimi', 'Fushimi Inari', 'Cultura', 34.9671, 135.7727, 120),
  p('kyoto', 'kinkakuji', 'Kinkaku-ji', 'Cultura', 35.0394, 135.7292, 60),
  p('kyoto', 'arashiyama', 'Bambuzal de Arashiyama', 'Natureza', 35.017, 135.6713, 75),
  p('kyoto', 'kiyomizu', 'Kiyomizu-dera', 'Cultura', 34.9949, 135.785, 75),
  p('kyoto', 'nishiki', 'Mercado Nishiki', 'Gastronomia', 35.005, 135.7649, 45),
  p('kyoto', 'gion', 'Gion', 'Vida Noturna', 35.0037, 135.7788, 90),
  // Rio
  p('rio', 'cristo', 'Cristo Redentor', 'Cultura', -22.9519, -43.2105, 90),
  p('rio', 'pao-acucar', 'Pão de Açúcar', 'Natureza', -22.9486, -43.1566, 120),
  p('rio', 'copacabana', 'Praia de Copacabana', 'Natureza', -22.9711, -43.1822, 90),
  p('rio', 'selaron', 'Escadaria Selarón', 'Cultura', -22.9154, -43.1793, 30),
  p('rio', 'jardim-botanico', 'Jardim Botânico', 'Natureza', -22.9674, -43.2245, 90),
  p('rio', 'amanha', 'Museu do Amanhã', 'Cultura', -22.8944, -43.1794, 75),
  p('rio', 'lapa', 'Arcos da Lapa', 'Vida Noturna', -22.9132, -43.1803, 120),
  // Santorini
  p('santorini', 'oia', 'Pôr do sol em Oia', 'Natureza', 36.4618, 25.3753, 90),
  p('santorini', 'fira', 'Fira', 'Cultura', 36.4167, 25.4318, 75),
  p('santorini', 'red-beach', 'Praia Vermelha', 'Natureza', 36.3485, 25.3947, 90),
  p('santorini', 'akrotiri', 'Sítio de Akrotiri', 'Cultura', 36.3517, 25.4035, 60),
  p('santorini', 'imerovigli', 'Imerovigli', 'Natureza', 36.4318, 25.4231, 45),
  p('santorini', 'santo-wines', 'Vinícola Santo Wines', 'Gastronomia', 36.3906, 25.4372, 75),
  // Nova York
  p('nova-york', 'central-park', 'Central Park', 'Natureza', 40.7829, -73.9654, 120),
  p('nova-york', 'times-square', 'Times Square', 'Vida Noturna', 40.758, -73.9855, 45),
  p('nova-york', 'liberdade', 'Estátua da Liberdade', 'Cultura', 40.6892, -74.0445, 150),
  p('nova-york', 'brooklyn', 'Ponte do Brooklyn', 'Cultura', 40.7061, -73.9969, 60),
  p('nova-york', 'moma', 'MoMA', 'Cultura', 40.7614, -73.9776, 120),
  p('nova-york', 'empire', 'Empire State Building', 'Cultura', 40.7484, -73.9857, 75),
  p('nova-york', 'high-line', 'High Line', 'Natureza', 40.748, -74.0048, 60),
  p('nova-york', 'chelsea', 'Chelsea Market', 'Gastronomia', 40.7424, -74.006, 60),
  // Buenos Aires
  p('buenos-aires', 'caminito', 'Caminito', 'Cultura', -34.6345, -58.3631, 60),
  p('buenos-aires', 'casa-rosada', 'Casa Rosada', 'Cultura', -34.6081, -58.3703, 45),
  p('buenos-aires', 'recoleta', 'Cemitério da Recoleta', 'Cultura', -34.5875, -58.3935, 60),
  p('buenos-aires', 'colon', 'Teatro Colón', 'Cultura', -34.6011, -58.3833, 75),
  p('buenos-aires', 'puerto-madero', 'Puerto Madero', 'Natureza', -34.6118, -58.3627, 60),
  p('buenos-aires', 'san-telmo', 'Feira de San Telmo', 'Gastronomia', -34.6212, -58.3731, 75),
  p('buenos-aires', 'palermo', 'Palermo Soho', 'Vida Noturna', -34.5885, -58.43, 120),
];

// Atividades ao ar livre além das de Natureza (praças, mirantes, monumentos abertos, bairros a pé).
const OUTDOOR_IDS = new Set([
  'madri-plaza-mayor', 'madri-malasana',
  'barcelona-gotic', 'barcelona-born',
  'lisboa-belem', 'lisboa-comercio', 'lisboa-bairro-alto',
  'paris-eiffel', 'paris-montmartre', 'paris-marais',
  'roma-coliseu', 'roma-forum', 'roma-trevi', 'roma-navona', 'roma-trastevere',
  'kyoto-fushimi', 'kyoto-kinkakuji', 'kyoto-kiyomizu', 'kyoto-gion',
  'rio-cristo', 'rio-selaron', 'rio-lapa',
  'santorini-fira', 'santorini-santo-wines',
  'nova-york-times-square', 'nova-york-liberdade', 'nova-york-brooklyn',
  'buenos-aires-caminito', 'buenos-aires-san-telmo', 'buenos-aires-palermo',
]);
places.forEach((pl) => {
  pl.outdoor = pl.category === 'Natureza' || OUTDOOR_IDS.has(pl.id);
});

export const isOutdoor = (place: Place) => place.outdoor ?? place.category === 'Natureza';

// Tradução: os campos de texto viram getters que leem o idioma atual, então qualquer tela
// que mostre destination.name ou place.name já aparece no idioma escolhido.
const PT_MONTHS = monthsShort('pt');

// "Abr – Jun" → "Apr – Jun"
const translateSeason = (season: string) =>
  season
    .split(' – ')
    .map((month) => monthsShort()[PT_MONTHS.indexOf(month)] ?? month)
    .join(' – ');

destinations.forEach((d) => {
  const base = { ...d };
  const text = () => destinationTexts[getLanguage()]?.[d.id];
  Object.defineProperties(d, {
    name: { get: () => text()?.name ?? base.name, enumerable: true },
    country: { get: () => text()?.country ?? base.country, enumerable: true },
    tagline: { get: () => text()?.tagline ?? base.tagline, enumerable: true },
    description: { get: () => text()?.description ?? base.description, enumerable: true },
    tags: { get: () => base.tags.map((tag) => tagNames[getLanguage()]?.[tag] ?? tag), enumerable: true },
    bestSeason: { get: () => translateSeason(base.bestSeason), enumerable: true },
  });
});

places.forEach((pl) => {
  const baseName = pl.name;
  Object.defineProperty(pl, 'name', { get: () => placeNames[getLanguage()]?.[pl.id] ?? baseName, enumerable: true });
});

// Registro de locais: catálogo fixo + locais sugeridos pela IA (adicionados em tempo de execução).
const placeById = new Map(places.map((pl) => [pl.id, pl]));
const destinationById = new Map(destinations.map((d) => [d.id, d]));

export const registerPlaces = (list: Place[]) => list.forEach((pl) => placeById.set(pl.id, pl));

export const getPlace = (id: string) => placeById.get(id);
export const getDestination = (id: string) => destinationById.get(id);
export const getPlacesByCity = (cityId: string) => [...placeById.values()].filter((pl) => pl.cityId === cityId);

// Centro aproximado da cidade (média das coordenadas do catálogo), usado para orientar a IA.
export function getCityCenter(cityId: string) {
  const list = places.filter((pl) => pl.cityId === cityId);
  const lat = list.reduce((acc, pl) => acc + pl.lat, 0) / list.length;
  const lng = list.reduce((acc, pl) => acc + pl.lng, 0) / list.length;
  return { lat, lng };
}

export const exploreDeck = destinations;
