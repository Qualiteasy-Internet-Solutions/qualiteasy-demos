# Gestor d'incidències Qualiteasy · demo estàtica

Prototip interactiu per revisar el recorregut d'una incidència: alta simple d'operari o alta administrativa, revisió, assignació, execució, pretancament amb fotografia, validació o retorn, ordre de treball imprimible i possible derivació excepcional a una no conformitat.

## Abast

- Els perfils són simulats i no constitueixen autenticació ni control d'accés.
- Les incidències i fotografies inicials són fictícies i sintètiques. Les ubicacions del mapa són orientatives.
- Els canvis i fotos afegits viuen només en memòria de la pestanya. Recarregar la pàgina restableix la mostra.
- No hi ha backend, base de dades ni integració operativa; els correus i WhatsApp només es previsualitzen.
- El mapa carrega tessel·les d'OpenStreetMap. El GPS requereix permís del navegador i HTTPS o localhost.

## Execució local

```sh
python3 -m http.server 8093
```

Obre `http://localhost:8093/`. GitHub Pages publica aquesta branca (`demo-estatica`, carpeta arrel). Els recursos fan servir rutes relatives.

La demo reutilitza el disseny del prototip operatiu i substitueix les seves crides d'API per un model temporal al navegador. És un artefacte de revisió visual i funcional, no una implementació de producció.
