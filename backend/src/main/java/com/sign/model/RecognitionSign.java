package com.sign.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "recognition_signs")
@Data
public class RecognitionSign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String word;
    
    @Column(name = "variation_idx")
    private Integer variationIdx;
    
    @Column(columnDefinition = "TEXT")
    private String frames;
}
