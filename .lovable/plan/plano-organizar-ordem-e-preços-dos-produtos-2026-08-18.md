# Plano: Organizar Ordem e Preços dos Produtos

O objetivo é ajustar a lista de produtos em `src/data/lojaProducts.ts` para que a ordem e os preços correspondam exatamente à imagem de referência fornecida pelo usuário, sem adicionar novos produtos.

## Alterações

### Dados dos Produtos
- **Arquivo:** `src/data/lojaProducts.ts`
- **Ação:** Reordenar os objetos no array `lojaProducts` e atualizar o campo `price` de cada um para bater com a imagem.

#### Ordem e Preços baseados na imagem:
1. **JBL Boombox 3 Preto** -> R$ 67,90
2. **iPhone 17 Pro Max 256GB** -> R$ 149,00
3. **Bicicleta Elétrica Scooter 500W** -> R$ 123,87
4. **Bicicleta Absolute Nero 5** -> R$ 97,76
5. **Smart TV 43 Polegadas LED** -> R$ 111,97
6. **Robô Aspirador WAP Robot W90** -> R$ 92,62
7. **JBL PartyBox 710 Preta** -> R$ 119,92
8. **iPhone 15 Pro Max 512GB Titânio Preto** -> R$ 227,33
9. **Tablet Xiaomi Redmi Pad Pro 256GB** -> R$ 101,47
10. **Patinete Elétrico Xiaomi Mi Pro 2** -> R$ 79,24
11. **Aspirador de Pó e Água WAP GTW 10** -> R$ 69,93
12. **Tablet Samsung Galaxy Tab A11** -> R$ 99,18
13. **Geladeira Frost Free Brastemp Inverse 447L** -> R$ 143,57
14. **Geladeira Brastemp Frost Free French Door 554L** -> R$ 194,28
15. **Samsung Galaxy S25 Ultra 5G, 512GB** -> R$ 123,80
16. **Smartphone Xiaomi Redmi Note 14 Pro 5G** -> R$ 114,99
17. **Fogão 5 Bocas Mesa De Vidro Preto** -> R$ 93,99
18. **Fritadeira Elétrica Mondial AFON-12L** -> R$ 87,54
19. **Smart TV TCL 65 Polegadas QLED 4K** -> R$ 171,18
20. **Smart TV 55 Polegadas LG OLED evo C3** -> R$ 127,33
21. **Xiaomi Poco X6 Pro 8GB RAM 256GB Preto** -> R$ 87,27
22. **Xiaomi Poco X6 Pro 5G 12GB 512GB Gray** -> R$ 89,91
23. **Jogo De Panelas Vanilla 10pçs Brinox** -> R$ 83,42
24. **Kit 5 Panelas Brinox Ceramic Life Optima 4.5** -> R$ 96,93
25. **iPhone 15 (256GB) Rosa** -> R$ 139,11
26. **Apple iPhone 15 256GB Azul** -> R$ 139,11
27. **Ar Condicionado LG Inverter IA 12000 Btus** -> R$ 134,75
28. **Kit Combinado De 7 Ferramentas DEWALT** -> R$ 92,97
29. **Guarda-Roupa Casal Easy Slim 8 Portas** -> R$ 94,62
30. **Penteadeira 5 Gavetas 3 Nichos Blum** -> R$ 67,12
31. **Lavadora De Alta Pressão Kärcher K2 Plus** -> R$ 81,72
32. **Purificador de Água Electrolux PE11B Branco** -> R$ 69,93
33. **Microondas Brastemp 38L Inox** -> R$ 108,12
34. **Cafeteira Portátil Nescafé Dolce Gusto Arno Mini Me** -> R$ 87,30
35. **Caixa De Som JBL Boombox 4** -> R$ 121,90
36. **Jogo Lençol Super King Size 4 Peças** -> R$ 69,93
37. **Robô Aspirador Mondial Fast Clean RB-01** -> R$ 84,27
38. **Jogo de Cama King Size 4 Peças 400 Fios** -> R$ 72,21
39. **JBL Flip 6 Black Edition** -> R$ 49,93
40. **iPhone 15 128GB Green** -> R$ 139,11
41. **iPhone 16 Pro Max (1 TB) Titânio Preto** -> R$ 297,33
42. **iPad 10ª Geração 64GB Wi-Fi Blue** -> R$ 123,87
43. **Console PlayStation 5 Slim com 1TB SSD** -> R$ 299,27
44. **Pelúcia Stitch Disney Gigante 45cm** -> R$ 51,21
45. **Barbeador Philips OneBlade Pro 360** -> R$ 42,97
46. **Gabinete Gamer Rise Mode Glass 06 White** -> R$ 103,12
47. **Pneu Aro 15 Michelin Primacy 4 195/60R15** -> R$ 92,10
48. **Filtro De Água Electrolux Prata** -> R$ 69,93
49. **Fogão 5 Bocas Atlas Mesa Inox Bivolt** -> R$ 104,29
50. **Caixa JBL PartyBox Encore Essential** -> R$ 97,76
51. **XIAOMI POCO X5 5G Global 256 GB Blue** -> R$ 84,97
52. **Monitor Samsung 24 LED Full HD 75Hz** -> R$ 87,42
53. **Samsung Galaxy S25 Ultra 5G 512GB Gray** -> R$ 123,80

## Verificação
- Garantir que nenhum produto foi removido ou adicionado acidentalmente.
- Verificar se os slugs permanecem os mesmos para evitar quebra de links.
