# Fonts

Téléchargez les fichiers suivants et placez-les dans ce dossier avant le premier `expo start`:

| Fichier attendu | Source |
|---|---|
| `PlayfairDisplay-Regular.ttf` | https://fonts.google.com/specimen/Playfair+Display |
| `PlayfairDisplay-Bold.ttf` | idem |
| `PlayfairDisplay-Italic.ttf` | idem |
| `CormorantGaramond-Italic.ttf` | https://fonts.google.com/specimen/Cormorant+Garamond |
| `Inter-Regular.ttf` | https://fonts.google.com/specimen/Inter |
| `Inter-Medium.ttf` | idem |
| `Inter-SemiBold.ttf` | idem |
| `Inter-Bold.ttf` | idem |

Alternative rapide via npm :

```bash
npm i @expo-google-fonts/playfair-display @expo-google-fonts/cormorant-garamond @expo-google-fonts/inter
```

Puis dans `app/_layout.tsx`, remplacez `useFonts({...})` par l'import des Google Fonts.
