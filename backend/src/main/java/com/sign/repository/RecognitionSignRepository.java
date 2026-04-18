package com.sign.repository;

import com.sign.model.RecognitionSign;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecognitionSignRepository extends JpaRepository<RecognitionSign, Long> {
    List<RecognitionSign> findByWord(String word);
}
