#!/bin/bash
echo "🔧 Arreglando autenticación de Git para carcompare"
echo ""

# Configurar usuario correcto
git config --global user.name "Victor Jaen comins"
git config --global user.email "victorjaencomins@users.noreply.github.com"

# Limpiar credenciales almacenadas
git config --global --unset credential.helper
git config --system --unset credential.helper

# Reset remote URL
git remote set-url origin https://github.com/vjaencomins-prog/carcompare.git

echo "✅ Configuración actualizada"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "1. Ve a https://github.com/settings/tokens"
echo "2. Genera un 'Personal Access Token' con permisos 'repo'"
echo "3. Copia el token"
echo "4. Cuando git te pida usuario: vjaencomins-prog"
echo "5. Cuando git te pida password: pega el token"
echo ""
echo "Luego ejecuta: git push origin main"