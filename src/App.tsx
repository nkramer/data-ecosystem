import YAML from "yaml";
import layercakeRaw from "../layercake.yaml?raw";

type Layer = {
  name: string;
  description: string;
};

type LayercakeFile = {
  analytics_layer_cake?: Layer[];
};

const parsed = YAML.parse(layercakeRaw) as LayercakeFile;
const layers = Array.isArray(parsed?.analytics_layer_cake)
  ? parsed.analytics_layer_cake
  : [];

const catalogLayer = layers.find((layer) =>
  layer.name.toLowerCase().includes("catalogs")
);
const mainLayers = catalogLayer
  ? layers.filter((layer) => layer !== catalogLayer)
  : layers;

export default function App() {
  return (
    <main className="page">
      <section className="stack stack--main" aria-label="Layercake">
        {mainLayers.map((layer) => (
          <article className="layer" key={layer.name}>
            <h2 className="layer__title">{layer.name}</h2>
            <p className="layer__description">{layer.description}</p>
          </article>
        ))}
      </section>
      {catalogLayer && (
        <aside className="stack stack--side" aria-label="Catalogs">
          <article className="layer layer--side">
            <h2 className="layer__title">{catalogLayer.name}</h2>
            <p className="layer__description">{catalogLayer.description}</p>
          </article>
        </aside>
      )}
    </main>
  );
}
