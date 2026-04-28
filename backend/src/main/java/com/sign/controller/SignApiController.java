package com.sign.controller;

import com.sign.model.AvatarSign;
import com.sign.repository.AvatarSignRepository;
import com.sign.service.DTWService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow React to connect
public class SignApiController {

    @Autowired
    private AvatarSignRepository avatarSignRepository;

    @Autowired
    private DTWService dtwService;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @GetMapping("/avatar/{lang}/{word}")
    public ResponseEntity<?> getAvatarFrames(@PathVariable String lang, @PathVariable String word) {
        Optional<AvatarSign> sign = avatarSignRepository.findByLangAndWord(lang.toUpperCase(), word.toLowerCase());
        if (sign.isPresent()) {
            try {
                // Parse the string stored in DB as a JSON object so it returns correctly to frontend
                return ResponseEntity.ok(objectMapper.readTree(sign.get().getFrames()));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body("Error parsing sign data");
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/recognize")
    public ResponseEntity<DTWService.MatchResult> recognizeSign(@RequestBody List<List<double[]>> sequence) {
        DTWService.MatchResult result = dtwService.matchSign(sequence);
        return ResponseEntity.ok(result);
    }
}
