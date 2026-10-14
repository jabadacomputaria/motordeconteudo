// A marca muda a cada vídeo (a do cliente de cada peça). Cada vídeo tem o seu brand.json.
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export type FontFile = {src: string; weight: string};

export type Brand = {
  name: string;
  colors: {
    bg: string; // fundo chapado (sem gradiente)
    surface: string; // cartões e painéis
    ink: string; // texto principal
    muted: string; // texto secundário, linhas
    accent: string; // a ÚNICA cor de destaque
    onAccent: string; // texto em cima da cor de destaque
    trail?: string; // opcional: rastro/elementos de identidade
    line?: string; // opcional: linhas finas e curvas
    signal?: string; // opcional: cor de sinal de interface (ex.: azul do visto), quando o brief pede uma cor
  };
  fonts: {
    display: {family: string; files: FontFile[]; titleWeight?: number}; // uma fonte de título
    ui: {family: string; files: FontFile[]}; // uma fonte de interface
    mono?: {family: string; files: FontFile[]}; // opcional: variante mono da fonte de interface (números, código)
  };
  notes?: string;
};

const loaded = new Set<string>();

// Carrega as fontes do brand a partir de public/. O Remotion segura o render até terminar.
export const loadBrandFonts = (brand: Brand) => {
  const faces = [brand.fonts.display, brand.fonts.ui, ...(brand.fonts.mono ? [brand.fonts.mono] : [])];
  for (const face of faces) {
    for (const file of face.files) {
      const key = `${face.family}:${file.weight}`;
      if (loaded.has(key)) continue;
      loaded.add(key);
      loadFont({family: face.family, url: staticFile(file.src), weight: file.weight});
    }
  }
};
