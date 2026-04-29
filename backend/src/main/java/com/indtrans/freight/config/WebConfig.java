//package com.indtrans.freight.config;
//
//import org.springframework.context.annotation.Configuration;
//import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
//import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
//
//@Configuration
//public class WebConfig implements WebMvcConfigurer {
//
//    @Override
//    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        // Serve ALL uploaded files (gallery, vehicles/rc, vehicles/insurance,
//        // vehicles/permit, vehicles/licence, billing/receipts, etc.) from disk.
//        // Because server.servlet.context-path=/api, the public URL is:
//        //   http://<host>:<port>/api/uploads/<subdir>/<file>
//        String uploadDir = System.getProperty("user.dir") + "/uploads/";
//        registry.addResourceHandler("/uploads/**")
//                .addResourceLocations("file:" + uploadDir);
//    }
//}
