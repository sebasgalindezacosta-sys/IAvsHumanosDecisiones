# Prompts para las imágenes de los agentes

Tres imágenes: **hombre**, **mujer** (condición "persona", se asigna una al azar a cada participante) e **IA**.
Las tres comparten el mismo bloque base: encuadre, fondo, luz, ropa, expresión y estilo. Así lo único que cambia es *quién* recomienda.

## Cómo generarlas para que queden comparables

1. Usa **la misma herramienta y la misma sesión** para las tres (ChatGPT, Gemini o Firefly). Si la herramienta permite fijar una semilla (*seed*), usa la misma.
2. Pega el **bloque base completo** + el bloque del sujeto. No cambies nada del bloque base entre imágenes.
3. Genera 3–4 variantes de cada una y elige el trío más parecido en encuadre, brillo, nitidez y "amabilidad" percibida. Evita la que se vea claramente más atractiva, más seria o más sonriente que las otras.
4. Lo ideal: pide a 5–10 personas (que no vayan a participar) que califiquen cada imagen de 1 a 7 en *amable*, *confiable* y *competente*. Si una se aleja mucho de las otras, regenérala.
5. Guárdalas cuadradas (512×512 o más) como `public/agentes/humano_hombre.jpg`, `humano_mujer.jpg` e `ia.jpg`. En la página se muestran recortadas en círculo.

---

## Bloque base (igual para las tres)

```
Square 1:1 studio headshot, head and shoulders, subject perfectly centered and facing the camera,
looking directly into the lens, eyes at about 40% from the top of the frame, small margin above the head,
shoulders cut at mid-chest. Plain seamless light gray background (hex #E6EAEE), flat, no gradient,
no props, no text, no logos, no watermark. Soft, even frontal studio lighting, no dramatic shadows,
neutral white balance. Calm, friendly, approachable expression with a slight closed-mouth smile.
Photorealistic, sharp focus, natural detail, 85mm lens, f/8. Ordinary, approachable appearance,
not a fashion model, not glamorous.
```

## Persona — hombre

```
[BLOQUE BASE]
Subject: a Colombian man, about 27 years old, medium brown skin (mestizo), short neat dark brown hair,
clean-shaven, natural eyebrows. Wearing a plain medium-gray crew-neck t-shirt with no logos or prints.
No glasses, no jewelry, no earrings, no watch, no tattoos, no hat.
```

## Persona — mujer

```
[BLOQUE BASE]
Subject: a Colombian woman, about 27 years old, medium brown skin (mestizo), dark brown hair pulled back
in a simple low ponytail, natural eyebrows, minimal natural makeup. Wearing a plain medium-gray crew-neck
t-shirt with no logos or prints. No glasses, no jewelry, no earrings, no watch, no tattoos, no hat.
```

## IA

```
[BLOQUE BASE]
Subject: a friendly, minimalist humanoid AI assistant robot, head and shoulders only, same pose and
framing as a person in a passport-style portrait. Smooth matte white and light-gray surfaces, softly
rounded head with a dark glossy face screen showing two simple soft-white oval eyes looking at the camera
(gentle, calm, not glowing intensely). No mouth, no human skin, no hair, no visible wires. Upper torso
in matte medium gray, same tone as a plain gray t-shirt. Clean product-photography look, not scary,
not uncanny, not a toy, not a cartoon.
```

## Si la herramienta acepta "prompt negativo"

```
text, letters, watermark, logo, brand, extra people, hands, props, jewelry, glasses, tattoos,
dramatic lighting, colored background, gradient background, blur, low resolution, cartoon,
anime, illustration, distorted face, asymmetrical eyes
```

## Notas metodológicas

- **Misma edad aparente, mismo tono de piel, misma ropa, misma expresión** en hombre y mujer: si difieren en atractivo o calidez, el efecto "persona" podría depender de cuál imagen le tocó a cada participante. Por eso se guarda `genero_agente` y el script compara hombre vs. mujer (exploratorio).
- **El robot va en el mismo encuadre de retrato** que las personas, con "ojos" que miran a la cámara: la IA tiene presencia equivalente, y lo que cambia es humano vs. máquina.
- El texto de la tarjeta sigue siendo "Recomendación de **una persona**" y "Recomendación de **una inteligencia artificial**"; la imagen solo lo acompaña.
- Si en lugar de fotos prefieren ilustraciones, cambien *Photorealistic … 85mm lens, f/8* por *clean flat vector illustration, soft shading* **en las tres** (nunca mezclar estilos).
