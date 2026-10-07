import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

// Imagem que cobre todo o container pai. Largura/altura explícitas são necessárias:
// imagens locais (require) herdam o tamanho original do arquivo e "vazam" do container
// quando só se usa absoluteFill.
export function CoverImage({ source }: { source?: ImageSourcePropType }) {
  if (!source) return null;
  return <Image source={source} style={styles.fill} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});
