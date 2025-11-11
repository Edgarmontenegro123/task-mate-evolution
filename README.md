# 🧠 Task Mate Evolution

**Task Mate Evolution** es una aplicación móvil desarrollada con **React Native (Expo)** y **TypeScript**, diseñada como un **gestor inteligente de tareas y notas**, combinando texto y grabaciones de voz dentro de una interfaz moderna, minimalista y fluida.

---

## 💡 Descripción

Task Mate Evolution permite crear, editar, eliminar notas de texto y grabar notas de voz de manera totalmente **offline**, con almacenamiento local en el dispositivo.  
Su objetivo es ofrecer una experiencia rápida, accesible y personalizable, ideal para usuarios que buscan organización sin depender de conexión a internet.

---

## 🧱 Stack Técnico

| Categoría | Tecnología / Detalle |
|------------|----------------------|
| Framework | React Native + Expo SDK 54 |
| Lenguaje | TypeScript |
| Almacenamiento local | AsyncStorage |
| Audio | expo-audio |
| Navegación | React Navigation (Native Stack) |
| Drag & Drop | react-native-draggable-flatlist |
| Temas visuales | Hook propio `useThemeColors` (modo claro / oscuro) |
| Modal de edición | `EditTaskModal` funcional |
| Modal de grabación | `RecordingModal` (en proceso de mejora visual) |

---

## 📲 Funcionalidades Principales

### ✅ Gestión de tareas
- Crear, editar, completar y eliminar notas.
- Asignar color personalizado.
- Reordenar mediante **drag & drop**.
- Persistencia local automática.

### 🎙️ Notas de voz
- Grabación local con **expo-audio**.
- Reproducción y persistencia en AsyncStorage.
- Nomenclatura automática: `grabación.01`, `grabación.02`, etc.

### 🗑️ Historial de notas eliminadas
- Almacena notas durante 30 días antes del borrado definitivo.
- Permite **recuperar o eliminar manualmente**.
- Reproduce audios desde el historial.

### 🌓 Modo claro / oscuro
- Implementado mediante hook personalizado `useThemeColors`.
- Ícono dinámico (sol/luna) en el header.

---

## 🧠 Próximas Funcionalidades
- Compartir notas o audios mediante **expo-sharing**.
- Nuevo **modal de grabación animado** (micrófono pulsante, temporizador, botones redondeados).
- Cargar imágenes para completar notas.
- Filtros y búsqueda de notas.
- Agregar recordatorios.
- Refinamiento visual (animaciones, tipografía, sombras suaves).
- Sincronización en la nube (Firebase o Supabase).
- Implementación de AI para Transcripción automática de notas de voz, Resúmenes inteligentes de notas (texto o voz) y Clasificación automática de notas (AI tags).

---

## ⚙️ Instalación y Ejecución

```bash
# Clonar el repositorio
git clone https://github.com/Edgarmontenegro123/TaskMateEvolution.git

# Entrar en el proyecto
cd TaskMateEvolution

# Instalar dependencias
npm install

# Ejecutar en Expo Go
npx expo start
📱 Escanear el código QR con la app Expo Go para probar en Android o iOS.
