package com.sign.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "avatar_signs")
@Data
public class AvatarSign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String lang;
    private String word;
    
    @Column(columnDefinition = "TEXT")
    private String frames;
}
