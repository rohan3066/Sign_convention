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

    @GetMapping("/avatar/{lang}/{word}")
    public ResponseEntity<?> getAvatarFrames(@PathVariable String lang, @PathVariable String word) {
        Optional<AvatarSign> sign = avatarSignRepository.findByLangAndWord(lang.toUpperCase(), word.toLowerCase());
        if (sign.isPresent()) {
            return ResponseEntity.ok(sign.get().getFrames());
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/recognize")
    public ResponseEntity<DTWService.MatchResult> recognizeSign(@RequestBody List<List<double[]>> sequence) {
        DTWService.MatchResult result = dtwService.matchSign(sequence);
        return ResponseEntity.ok(result);
    }
}
