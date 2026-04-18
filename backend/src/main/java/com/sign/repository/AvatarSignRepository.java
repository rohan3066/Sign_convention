package com.sign.repository;

import com.sign.model.AvatarSign;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AvatarSignRepository extends JpaRepository<AvatarSign, Long> {
    Optional<AvatarSign> findByLangAndWord(String lang, String word);
}
