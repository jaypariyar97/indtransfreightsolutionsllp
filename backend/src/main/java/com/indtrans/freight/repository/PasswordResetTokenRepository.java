package com.indtrans.freight.repository;

import com.indtrans.freight.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {

    Optional<PasswordResetToken> findByToken(String token);

    /** Invalidate any unused, unexpired tokens for an employee — called when
     *  a user requests a fresh reset link so old links stop working. */
    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.used = true WHERE p.employeeId = :employeeId AND p.used = false")
    void invalidateActiveForEmployee(@Param("employeeId") String employeeId);

    @Modifying
    @Query("DELETE FROM PasswordResetToken p WHERE p.expiresAt < :before")
    int deleteExpiredBefore(@Param("before") Instant before);
}
