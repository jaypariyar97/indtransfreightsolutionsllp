
package com.indtrans.freight.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.indtrans.freight.util.JwtUtil;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    // ✅ Manual logger instead of @Slf4j
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    // ✅ Use @Autowired instead of final + @RequiredArgsConstructor
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        
        // Skip if no Authorization header or doesn't start with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Extract token
        jwt = authHeader.substring(7);
        
        try {
            // Extract username from token
            userEmail = jwtUtil.extractUsername(jwt);
            log.debug("Extracted username from token: {}", userEmail);
            
            // If username exists and no authentication in context yet
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // Load user details
                log.debug("Loading user details for: {}", userEmail);
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                
                // Validate token
                if (jwtUtil.validateToken(jwt, userDetails)) {
                    log.debug("Token validated successfully for: {}", userEmail);
                    
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,  // credentials (not needed after auth)
                                    userDetails.getAuthorities()
                            );
                    
                    // Add request details
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    
                    // Set authentication in security context
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Authentication set in SecurityContext for: {}", userEmail);
                } else {
                    log.debug("Token validation failed for: {}", userEmail);
                    log.warn("JWT validation failed for: {} (signature/expiry mismatch)", userEmail);

                }
            }
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            // Token is invalid or expired - just continue without authentication
            log.debug("JWT references a user that does not exist in DB: {}", e.getMessage());
        }catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
        }
        
        // Continue filter chain
        filterChain.doFilter(request, response);
    }
}