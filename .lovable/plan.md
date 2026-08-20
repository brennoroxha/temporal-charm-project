# Sustituir 8 productos por las versiones de Mercado Libre México

Se reemplazan nombre, precio, galería y opiniones de 8 productos, manteniendo el mismo patrón ya usado en las sustituciones anteriores (precio de venta = 5% del precio de comparación, badge 95% OFF).

## Productos y datos

| Actual | Nuevo nombre | Comparación | Venta (5%) |
|---|---|---|---|
| JBL Boombox 3 Negro | Bocina JBL Boombox 3 portátil con bluetooth waterproof black | $ 7.138,87 | $ 356,94 |
| iPhone 17 Pro Max 256GB | Apple iPhone 17 Pro Max (256 GB) - Naranja cósmico - Sólo eSIM | $ 27.299,93 | $ 1.365,00 |
| Altavoz JBL Boombox 4 Bluetooth | Bocina JBL PartyBox Encore 2 Plus portátil con bluetooth negra | $ 5.899,27 | $ 294,96 |
| Tablet Samsung Galaxy Tab A11 | Tablet Galaxy Tab A11+ Plata 128gb 6gb Ram Plateado Samsung | $ 4.599,20 | $ 229,96 |
| Patinete Eléctrico Honeywhale M2 Pro | Honey Whale E9t Scooter Patin Electrico 32 Km/h Honeywhale Negro | $ 9.999,27 | $ 499,96 |
| Aspiradora WAP GTW 10 | Aspiradora De Agua Y Solidos 3,700 Watts Máximo, Truper Color Naranja | $ 3.940,01 | $ 197,00 |
| Xiaomi Redmi Note 14 Pro 5G | Teléfono Xiaomi Redmi Note 14 Pro Plus 5g 12 GB RAM 256 GB ROM 200 MP Azul | $ 6.922,47 | $ 346,12 |
| Freidora Air Fryer Mondial | Freidora De Aire Flex 2 Zonas De Cocción 11 Litros CKSTAF11MCDDF Oster | $ 3.929,87 | $ 196,49 |

## Cambios técnicos

1. `src/data/lojaProducts.ts`: por cada producto, actualizar `title`, `id`/`slug` al nuevo slug, `price`, `oldPrice` e `img` (primera imagen de la galería). Se conserva `stock` y `voltagem` actuales.
2. `src/data/lojaGallery.ts`: reemplazar la entrada por el nuevo slug con las 4 URLs indicadas (incluyendo el placeholder `picture-play.svg` donde el usuario lo listó, igual que en productos anteriores).
3. `src/data/lojaReviews.ts`: reemplazar las opiniones por las enviadas (texto en español + todas las imágenes de cada opinión), con 5 estrellas, fechas recientes coherentes y contadores de "útil" en el mismo estilo del resto del archivo.

No se tocan componentes ni lógica; solo datos.
