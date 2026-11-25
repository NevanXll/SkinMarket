# Verificación de React

El punto de entrada `src/main.jsx` monta React con createRoot, HashRouter y MarketProvider. `src/App.jsx` define las rutas. Las vistas se encuentran en `src/pages` y los componentes reutilizables en `src/components`. Los formularios y filtros usan useState; las operaciones de cuenta y compra usan useContext mediante MarketProvider.

`src/services/api.js` realiza las peticiones REST y mantiene el JWT de acceso en memoria. Al recargar se intenta renovar mediante una cookie HttpOnly. Usuarios, catálogo, carrito e inventario provienen del backend; localStorage solo conserva la preferencia USD/CLP.

Bootstrap se importa desde `src/main.jsx`. La aplicación conserva CSS propio para la temática de CS2. Los formularios usan clases de Bootstrap y los tamaños se adaptan con la cuadrícula y media queries.

La compilación se verifica con `npm run build`. Las pruebas Jasmine/Karma y la cobertura se ejecutan con `npm test`; el informe se genera en `coverage/index.html`. La protección visual de rutas complementa la autorización que Spring Security comprueba en el servidor.
