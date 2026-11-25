package cl.skinmarket.productos.controller;

import cl.skinmarket.common.exception.GlobalExceptionHandler;
import cl.skinmarket.common.model.Product;
import cl.skinmarket.productos.dto.ProductInput;
import cl.skinmarket.productos.service.ProductService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductControllerTest {
    private final ProductService products = mock(ProductService.class);
    private final MockMvc mvc =
            MockMvcBuilders.standaloneSetup(new ProductController(products))
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();

    @Test
    void createBindsCatalogFieldsAndReturnsLocation() throws Exception {
        var product = new Product();
        product.id = "skin-1";
        when(products.create(any(ProductInput.class))).thenReturn(product);

        mvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"AK | Skin","category":"Rifles","rarity":"Covert",
                                 "price":12.50,"stock":3,"image":"images/skins/skin.png"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/products/skin-1"))
                .andExpect(jsonPath("$.id").value("skin-1"));

        var input = ArgumentCaptor.forClass(ProductInput.class);
        verify(products).create(input.capture());
        assertEquals("AK | Skin", input.getValue().name());
        assertEquals(3, input.getValue().stock());
    }

    @Test
    void createRejectsNegativePriceAndStockBeforeCallingService() throws Exception {
        mvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"AK | Skin","category":"Rifles","rarity":"Covert",
                                 "price":-1,"stock":-1,"image":"images/skins/skin.png"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.price").exists())
                .andExpect(jsonPath("$.errors.stock").exists());

        verifyNoInteractions(products);
    }
}
