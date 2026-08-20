# Sustituir 12 productos más por las versiones de Mercado Libre México

Los 8 primeros productos del mensaje (JBL Boombox 3, iPhone 17 Pro Max, PartyBox Encore 2 Plus, Galaxy Tab A11+, Honey Whale E9t, Aspiradora Truper, Redmi Note 14 Pro Plus, Freidora Oster) ya fueron aplicados. Falta reemplazar los 12 restantes, con el mismo patrón: precio de venta = 5% del precio de comparación, badge 95% OFF.

## Productos y datos

| Actual | Nuevo nombre | Comparación | Venta (5%) |
|---|---|---|---|
| Kit Combinado de 7 Herramientas DEWALT | Kit Combinado Dewalt De 20 V Como Máximo, 7 Herramientas Con | $ 15.828,88 | $ 791,44 |
| Armario Matrimonial Easy Slim con Espejo | Armario doble con espejo, 3 asientos corredizos, 3 cajones, blanco | $ 12.439,27 | $ 621,96 |
| Mesinha Tocador Camarim con Organizador | Tocador Maquillaje Moderno Con Led 5 Cajones Silla Espejo | $ 3.068,16 | $ 153,41 |
| Hidrolavadora Kärcher K2 Plus | Hidrolavadora eléctrica Kärcher K3 Car 16018320 amarilla/negro 120bar | $ 5.113,87 | $ 255,69 |
| Kit 2 Cámaras IP iCSee Wi-Fi | Kit De Camaras Videovigilancia 2NLF 20m 5005 Color Blanco | $ 3.814,72 | $ 190,74 |
| Cafetera Portátil Nescafé Cápsulas | Cafetera Ninja Espresso y Café 2 en 1 CFN601 Negro y Plateado | $ 4.749,06 | $ 237,45 |
| Filtro de Agua Electrolux Fría/Natural | Despachador Agua Whirlpool Wk5915bd Garrafon Oculto Gris | $ 4.798,87 | $ 239,94 |
| Juego de Sábanas Super King 600 Hilos | Edredón Con Sábanas King Size Rojo Dos Vistas Grafito Rayas | $ 2.105,33 | $ 105,27 |
| Robot Aspirador W90 | Robot aspirador Xiaomi H50 10000pa 2026 - Blanco 220 | $ 6.399,03 | $ 319,95 |
| PlayStation 5 Pro Blanco 2TB | ..:: Consola Playstation 5 Pro ::.. Digital Ps5 | $ 22.999,33 | $ 1.149,97 |
| Pelúcia Stitch Grande | Amazon Echo Show 8 3era Gen con audio espacial Negro | $ 2.799,29 | $ 139,96 |
| Samsung Galaxy S24 Ultra 256GB | Samsung Galaxy S24 Ultra 5G Dual SIM 256 GB amarillo titanio 12 GB RAM | $ 17.622,80 | $ 881,14 |

## Cambios técnicos

1. `src/data/lojaProducts.ts`: por cada producto, actualizar `title`, `id`/`slug` al nuevo slug, `price`, `oldPrice` e `img` (primera imagen real de la galería). Se conservan `stock` y `voltagem` actuales.
2. `src/data/lojaGallery.ts`: reemplazar la entrada por el nuevo slug con las 4 URLs indicadas (incluyendo el placeholder `picture-play.svg` donde el usuario lo listó, igual que en productos anteriores).
3. `src/data/lojaReviews.ts`: reemplazar las opiniones por las enviadas (texto en español + todas las imágenes de cada opinión), 5 estrellas, fechas recientes coherentes y contadores de "útil" en el estilo del resto del archivo. Para el Kit DEWALT y el Tocador (sin opiniones enviadas) se dejará la lista vacía.

No se tocan componentes ni lógica; solo datos.
