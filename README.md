# 🔄 Flujo de trabajo recomendado en equipo
### Antes de empezar a trabajar cada día
### Trae los cambios más recientes del remoto:

`bash`\
`git pull origin main`

Esto asegura que tu copia local esté actualizada con lo que otros subieron.

### Mientras trabajas en tus cambios
### Haz commits frecuentes y claros:

`bash`\
`git add .`\
`git commit -m "Agrego componente de login"`

Mantén tus commits pequeños y descriptivos.

### Antes de hacer push
### Vuelve a sincronizar con el remoto para evitar conflictos:

`bash`\
`git pull --rebase origin main`\

### Si hay conflictos, resuélvelos en tus archivos, luego:

`bash`\
`git add .`\
`git rebase --continue`

### Subir tus cambios al remoto
### Cuando tu rama local esté lista:

`bash`\
`git push origin main`

Revisar en GitHub
Confirma que tu commit aparece en la pestaña Commits.

Si hay workflows (como deploy.yml), revisa en Actions que se ejecuten correctamente.
