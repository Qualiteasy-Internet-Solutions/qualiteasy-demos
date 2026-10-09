# Demos del nou Qualiteasy

Prototips funcionals dels mòduls del nou Qualiteasy, un per ruta. Són pàgines estàtiques sense backend: les dades són fictícies i els canvis només viuen a la pestanya del navegador.

| Ruta | Demo |
|---|---|
| `/` | Portada |
| `/no-conformitats/` | No conformitats i accions (sistema de gestió ISO 9001 + ENS + requisits legals) |
| `/incidents/` | Incidències de serveis municipals (cas Alella). És l’única versió mantinguda: l’adreça antiga de `qualiteasy-incidents` hi redirigeix. |

Cada demo defineix el contracte d’API del mòdul: totes les crides passen per una funció `api()` que avui respon des d’un magatzem en memòria. Vegeu el `README.md` de cada carpeta.

## Veure-ho en local

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/
```

## Afegir un mòdul

1. Crear la carpeta `/<mòdul>/` amb el seu `index.html` i rutes relatives.
2. Afegir-ne la targeta a `index.html`.

El codi del producte nou va en un repositori privat a part; aquest repositori és públic perquè GitHub Pages hi publica les demos.
