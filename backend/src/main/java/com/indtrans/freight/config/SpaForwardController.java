package com.indtrans.freight.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({
            "/",
            "/dashboard",
            "/track",
            "/track/{gcnNumber}",
            "/admin/login",
            "/admin/forgot-password",
            "/admin/reset-password",
            "/admin/change-password",
            "/admin/customers",
            "/admin/transporters",
            "/admin/vehicles",
            "/admin/drivers",
            "/admin/vhc",
            "/admin/gcn",
            "/admin/view-gcn",
            "/admin/billing",
            "/admin/gallery",
            "/admin/tracking",
            "/admin/users"
    })
    public String forwardToSpa() {
        return "forward:/index.html";
    }
}
