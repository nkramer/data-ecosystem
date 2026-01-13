import { useEffect, useMemo, useState } from "react";
import YAML from "yaml";
import layercakeRaw from "../layercake.yaml?raw";

type Layer = {
  name: string;
  description: string;
  children?: Array<Layer | string>;
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

const getHashLayerName = () => {
  const raw = window.location.hash.replace(/^#/, "");
  return raw ? decodeURIComponent(raw) : null;
};

const toChildLayers = (layer: Layer) =>
  (layer.children ?? [])
    .map((child) =>
      typeof child === "string"
        ? { name: child, description: "" }
        : { name: child.name, description: child.description ?? "" }
    )
    .filter((child) => child.name);

export default function App() {
  const [selectedLayerName, setSelectedLayerName] = useState<string | null>(
    getHashLayerName()
  );

  useEffect(() => {
    const handleHashChange = () => setSelectedLayerName(getHashLayerName());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const selectedLayer = useMemo(
    () => layers.find((layer) => layer.name === selectedLayerName),
    [selectedLayerName]
  );
  const detailLayers = selectedLayer ? toChildLayers(selectedLayer) : [];
  const isDetailView = Boolean(selectedLayer);
  const pageTitle = selectedLayer?.name ?? "The Analytics Data Stack";

  const handleLayerClick = (layer: Layer) => {
    window.location.hash = encodeURIComponent(layer.name);
  };

  const handleBack = () => {
    window.location.hash = "";
  };

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">{pageTitle}</h1>
        {isDetailView && (
          <button className="page__back" type="button" onClick={handleBack}>
            Back to main stack
          </button>
        )}
      </header>
      {isDetailView ? (
        <section className="stack stack--detail" aria-label={pageTitle}>
          {detailLayers.map((layer) => (
            <article className="layer" key={layer.name}>
              <h2 className="layer__title">{layer.name}</h2>
              {layer.description ? (
                <p className="layer__description">{layer.description}</p>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="layout" aria-label="Layercake">
          <section className="stack stack--main">
            {mainLayers.map((layer) => (
              <button
                className="layer layer--interactive"
                key={layer.name}
                type="button"
                onClick={() => handleLayerClick(layer)}
              >
                <h2 className="layer__title">{layer.name}</h2>
                <p className="layer__description">{layer.description}</p>
              </button>
            ))}
          </section>
          {catalogLayer && (
            <aside className="stack stack--side" aria-label="Catalogs">
              <button
                className="layer layer--interactive layer--side"
                type="button"
                onClick={() => handleLayerClick(catalogLayer)}
              >
                <h2 className="layer__title">{catalogLayer.name}</h2>
                <p className="layer__description">{catalogLayer.description}</p>
              </button>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
