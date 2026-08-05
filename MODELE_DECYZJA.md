# Wybór modeli dla Asystenta PKB - decyzja oparta na danych

Data: 2026-08-03. Research wieloagentowy + weryfikacja adwersaryjna (4 agenty). Ceny potwierdzone na żywo z `openrouter.ai/api/v1/models`.

## KOREKTA: moja pierwsza rekomendacja (Sonnet 5) była błędna

Rekomendowałem `anthropic/claude-sonnet-5` kierując się ceną i kontekstem. Dane pokazały, że to zły wybór do TEGO zastosowania:

| Wskaźnik (im wyżej tym lepiej) | Sonnet 5 | Opus 5 | Kimi K3 | GPT-5.6 Terra |
|---|---|---|---|---|
| Toolathlon (narzędzia w pętli) | **54,3%** | **80,6%** | 73,2% | 74,9% |
| PLCC (język polski, 212 modeli) | **81,67 - najgorszy z 9** | 92,17 | 82,67 | 88,83 |
| BrowseComp (research w sieci) | 84,7% | 90,8% | 91,2% | 87,5% |
| AA-Briefcase (długie zadania, Elo) | 1388 | **1720** | 1548 | - |
| Cena in/out za mln tokenów | $2/$10* | $5/$25 | $3/$15 | **$1/$6** |

\* UWAGA: $2/$10 to cena promocyjna **do 31.08.2026**. Od września Sonnet 5 kosztuje $3/$15, czyli tyle co Kimi K3.

Dlaczego to dyskwalifikuje Sonneta 5 u nas:
1. **Rdzeniem Hermesa jest wywoływanie narzędzi w pętli** (szukaj -> czytaj -> sprawdź w rejestrze -> syntetyzuj). Sonnet 5 ma tu 54,3% wobec 80,6% Opusa 5. To nie jest niuans, to jest różnica między agentem, który dowozi brief, a takim, który się gubi w połowie.
2. **Produktem jest tekst po polsku dla prezesa.** Sonnet 5 jest ostatni z dziewiątki na polskim benchmarku PLCC.

## Werdykt o Kimi K3 (intuicja Pawła)

Intuicja nie była głupia: **Kimi K3 jest realnie najlepszy w głębokim researchu** - DeepSearchQA 95,0 (1. miejsce), ResearchRubrics 76,2 (1. miejsce), BrowseComp 91,2 (2. miejsce). To dokładnie ten typ pracy, który robi nasz agent.

Ale odpada z trzech powodów:
- **Polski 82,67** (przedostatni z dziewiątki), najsłabsze słownictwo (71) i kompetencja kulturowa (79). Brief dla prezesa ma brzmieć jak od człowieka z Polski.
- **Droższy niż Sonnet 5** ($3/$15) - teza "prawie Opus, ale taniej" była prawdziwa wobec Opusa 4.8, nie wobec Opusa 5, który wyszedł 8 dni po K3 i wygrywa z nim na Toolathlon (80,6 vs 73,2), AA-Briefcase (1720 vs 1548) i MCP Atlas (85,8 vs 84,2) przy różnicy ceny tylko 1,67x.
- Wolny (37-62 tok/s) i bardzo gadatliwy.

## DECYZJA

**Model główny: `anthropic/claude-opus-5`** ($5/$25)
- Najlepszy w wywoływaniu narzędzi w pętli (Toolathlon 80,6%, MCP Atlas 85,8%) - a to jest dokładnie mechanika Hermesa.
- Najlepszy w długich, wieloetapowych zadaniach (AA-Briefcase 1720 Elo, drugi Fable 5 z 1583).
- Polski 92,17 - w górnej strefie.
- Research w sieci 90,8% - praktycznie na poziomie liderów.

**Alternatywa oszczędna, gdyby rachunki bolały: `openai/gpt-5.6-terra`** ($1/$6, pięć razy taniej). Tool calling 74,9% (tyle samo co droższy Sol), BrowseComp 87,5%, polski 88,83. Bardzo dobry stosunek jakości do ceny.

**Modele pomocnicze (konfiguruję po SSH, nie w kreatorze):** Hermes ma 11 slotów pobocznych (tytuły sesji, kompresja kontekstu, streszczanie stron, klasyfikator zatwierdzeń, vision...), które domyślnie stoją na `auto`, czyli **płacą stawką modelu głównego**. To realne pieniądze wyrzucane na generowanie tytułów rozmów.

Plan: `google/gemini-3.6-flash` ($1,50/$7,50) na sloty tekstowe - ma **najlepszy polski z całej dziewiątki (PLCC 95,50)** i jest tani.

**Zapasowy dostawca (fallback):** `openai/gpt-5.6-sol` - żeby agent nie zamilkł w środku rozmowy z prezesem przy awarii Anthropic. Hermes przełącza się w trakcie tury bez utraty rozmowy.

## Szacunek kosztu

Jeden pełny brief o firmie (research w sieci + rejestry + synteza) to orientacyjnie 100 tys. tokenów wejścia i 10 tys. wyjścia:
- na Opusie 5: ok. $0,75 (ok. 3 zł)
- na Terrze: ok. $0,16 (ok. 0,65 zł)

Przy 20 briefach miesięcznie: 60 zł na Opusie, 13 zł na Terrze. Do tego codzienne rozmowy.

## Co pozostaje do sprawdzenia empirycznie

Benchmarki to nie jest dowód. Po uruchomieniu silnika zrobimy test na realnym zadaniu: ten sam brief o prawdziwej firmie na Opusie 5, Terrze i Kimi K3, porównanie jakości polszczyzny, trafności i kosztu. Dopiero to jest dowód.

## NIEZWERYFIKOWANE
- Wyniki benchmarków pochodzą z agregatorów (benchmarklist.com, Artificial Analysis) i kart modeli, nie z własnych pomiarów.
- PLCC to benchmark kompetencji językowo-kulturowej, nie mierzy wprost jakości pisania briefów biznesowych.
- Ceny mogą się zmienić; Sonnet 5 ma potwierdzoną podwyżkę od 01.09.2026.
